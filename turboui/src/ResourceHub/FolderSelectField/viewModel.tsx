import * as React from "react";

import { useResourceHubNodesListContext } from "../contexts/NodesListContext";
import type { FolderSelectLoadNode, ResourceHubNotAllowedSelection } from "../types";

// View model for FolderSelectField: syncs a form "location" field with a browsable folder tree.
export interface ViewModel {
  currentNode: FolderSelectLoadNode | undefined;
  nodes: FolderSelectLoadNode[];

  error: string | undefined;
  select: (node: FolderSelectLoadNode) => void;
  isNodeLoading: (node: FolderSelectLoadNode) => boolean;
}

// Form field value: the selected destination (folder or resource hub root).
interface ViewModelLocation {
  id: string;
  type: "folder" | "resourceHub";
}

export function useViewModel(
  fieldName: string,
  notAllowedSelections?: ResourceHubNotAllowedSelection[],
): ViewModel {
  const { forms, folderSelect } = useResourceHubNodesListContext();
  const [location, setValue] = forms.useFieldValue<ViewModelLocation>(fieldName);
  const error = forms.useFieldError(fieldName);

  // Explorer UI state derived from the current location.
  const [currentNode, setCurrentNode] = React.useState<FolderSelectLoadNode | undefined>();
  const [nodes, setNodes] = React.useState<FolderSelectLoadNode[]>([]);
  const [loading, setLoading] = React.useState<ViewModelLocation | undefined>();

  // When location changes, load that folder/hub and populate the explorer.
  React.useEffect(() => {
    setLoading(location);

    const loader =
      location.type === "folder"
        ? folderSelect.loadFolder(location.id)
        : folderSelect.loadResourceHub(location.id);

    loader
      .then((result) => {
        setCurrentNode(applyNotAllowedSelections(result.currentNode, notAllowedSelections));
        setNodes(result.nodes.map((node) => applyNotAllowedSelections(node, notAllowedSelections)!));
      })
      .finally(() => {
        setLoading(undefined);
      });
  }, [location, folderSelect, notAllowedSelections]);

  // Drill into a folder by updating the form field (re-triggers the load effect).
  const select = (node: FolderSelectLoadNode) => {
    if (!node.selectable) return;
    setValue(nodeToLocation(node));
  };

  const isNodeLoading = (node: FolderSelectLoadNode) => {
    if (!loading) return false;
    return folderSelect.compareIds(loading.id, node.resource.id ?? "");
  };

  return {
    error,
    select,
    isNodeLoading,
    currentNode,
    nodes,
  };
}

function nodeToLocation(node: FolderSelectLoadNode): ViewModelLocation {
  return {
    id: node.resource.id!,
    type: node.type === "folder" ? "folder" : "resourceHub",
  };
}

// e.g. prevent moving a folder into itself
function applyNotAllowedSelections(
  node: FolderSelectLoadNode,
  notAllowedSelections?: ResourceHubNotAllowedSelection[],
): FolderSelectLoadNode {
  if (!notAllowedSelections?.length || node.type === "resourceHub") {
    return node;
  }

  const blocked = notAllowedSelections.some((loc) => loc.id === node.resource.id && loc.type === node.type);

  if (!blocked) {
    return node;
  }

  return { ...node, selectable: false };
}
