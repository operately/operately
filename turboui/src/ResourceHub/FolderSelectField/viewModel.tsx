import * as React from "react";

import { useResourceHubNodesListContext } from "../contexts/NodesListContext";
import { getNodeId, getNodeName, getNodeResource, getNodeType, getResourceId } from "../selectors";
import type { FolderSelectCurrentLocation, ResourceHubNode, ResourceHubNotAllowedSelection } from "../types";

type FolderLocation = Extract<FolderSelectCurrentLocation, { type: "folder" }>["folder"];

interface ViewModelLocation {
  id: string;
  type: "folder" | "resourceHub";
}

interface ViewModelNode {
  id: string;
  name: string;
  type: "document" | "folder" | "file" | "link" | "resourceHub";
  selectable: boolean;
  location?: ViewModelLocation;
  iconNode?: ResourceHubNode;
  parent?: ViewModelNode;
}

// View model for FolderSelectField: syncs a form "location" field with a browsable folder tree.
export interface ViewModel {
  currentNode: ViewModelNode | undefined;
  nodes: ViewModelNode[];

  error: string | undefined;
  select: (node: ViewModelNode) => void;
  isNodeLoading: (node: ViewModelNode) => boolean;
}

const EMPTY_NOT_ALLOWED: ResourceHubNotAllowedSelection[] = [];

function notAllowedSelectionsKey(notAllowedSelections: ResourceHubNotAllowedSelection[]) {
  return notAllowedSelections.map((selection) => `${selection.type}:${selection.id}`).join("|");
}

export function useViewModel(
  fieldName: string,
  notAllowedSelections: ResourceHubNotAllowedSelection[] = EMPTY_NOT_ALLOWED,
): ViewModel {
  const { forms, folderSelect } = useResourceHubNodesListContext();
  const [location, setValue] = forms.useFieldValue<ViewModelLocation>(fieldName);
  const error = forms.useFieldError(fieldName);
  const blockedSelectionsKey = notAllowedSelectionsKey(notAllowedSelections);

  const [currentNode, setCurrentNode] = React.useState<ViewModelNode | undefined>();
  const [nodes, setNodes] = React.useState<ViewModelNode[]>([]);
  const [loading, setLoading] = React.useState<ViewModelLocation | undefined>();

  React.useEffect(() => {
    let cancelled = false;

    setLoading(location);

    const loader =
      location.type === "folder"
        ? folderSelect.loadFolder(location.id)
        : folderSelect.loadResourceHub(location.id);

    loader
      .then((result) => {
        if (cancelled) return;

        const current = buildCurrentNode(result.current, notAllowedSelections);

        setCurrentNode(current);
        setNodes(buildChildNodes(result.nodes, current, notAllowedSelections));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [location, folderSelect, blockedSelectionsKey]);

  const select = (node: ViewModelNode) => {
    if (!node.selectable || !node.location) return;
    setValue(node.location);
  };

  const isNodeLoading = (node: ViewModelNode) => {
    if (!loading || !node.location) return false;
    return folderSelect.compareIds(loading.id, node.location.id);
  };

  return {
    error,
    select,
    isNodeLoading,
    currentNode,
    nodes,
  };
}

function buildCurrentNode(current: FolderSelectCurrentLocation, notAllowedSelections: ResourceHubNotAllowedSelection[]): ViewModelNode {
  if (current.type === "resourceHub") {
    return {
      id: current.resourceHub.id,
      name: current.resourceHub.name,
      type: "resourceHub",
      selectable: true,
      location: { id: current.resourceHub.id, type: "resourceHub" },
    };
  }

  return {
    id: current.folder.id,
    name: current.folder.name ?? "",
    type: "folder",
    selectable: !isBlockedSelection(current.folder.id, "folder", notAllowedSelections),
    location: { id: current.folder.id, type: "folder" },
    parent: buildParentNode(current.folder),
  };
}

function buildParentNode(folder: FolderLocation): ViewModelNode {
  const parentFolder = folder.pathToFolder?.slice(-1)[0];

  if (parentFolder) {
    return {
      id: parentFolder.id,
      name: parentFolder.name ?? "",
      type: "folder",
      selectable: true,
      location: { id: parentFolder.id, type: "folder" },
    };
  }

  return {
    id: folder.resourceHub!.id,
    name: folder.resourceHub!.name,
    type: "resourceHub",
    selectable: true,
    location: { id: folder.resourceHub!.id, type: "resourceHub" },
  };
}

function buildChildNodes(
  nodes: ResourceHubNode[],
  currentNode: ViewModelNode,
  notAllowedSelections: ResourceHubNotAllowedSelection[],
): ViewModelNode[] {
  return nodes.flatMap((node) => {
    const nodeType = getNodeType(node);
    const nodeId = getResourceId(getNodeResource(node)) ?? getNodeId(node);

    if (!nodeType || !nodeId) return [];

    const selectable = nodeType === "folder" && !isBlockedSelection(nodeId, nodeType, notAllowedSelections);

    return [
      {
        id: nodeId,
        name: getNodeName(node),
        type: nodeType,
        selectable,
        location: selectable ? { id: nodeId, type: "folder" } : undefined,
        iconNode: node,
        parent: currentNode,
      },
    ];
  });
}

function isBlockedSelection(id: string, type: "folder", notAllowedSelections: ResourceHubNotAllowedSelection[]) {
  return notAllowedSelections.some((selection) => selection.type === type && selection.id === id);
}
