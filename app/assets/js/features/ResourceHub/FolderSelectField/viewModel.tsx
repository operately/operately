import * as React from "react";
import * as Hub from "@/models/resourceHubs";

import { sortNodesWithFoldersFirst } from "@/features/ResourceHub/utils";
import { useFieldValue, useFieldError } from "@/components/Forms/FormContext";
import { compareIds } from "@/routes/paths";
import { match } from "ts-pattern";

//
// Implements a data model for the FolderSelectField component, and integrates
// with the components/Forms module to manage the state of the form.
//
// currentNode: The currently selected node in the file explorer.
// nodes: The list of subnodes of the current node in the file explorer.
//

export interface ViewModel {
  currentNode: ViewModelNode | undefined;
  nodes: ViewModelNode[];

  error: string | undefined;
  select: (node: ViewModelNode) => void;
  isNodeLoading: (node: ViewModelNode) => boolean;
}

//
// Current location in the file explorer. The location can be a folder or a
// resource hub if we are at the root level.
//
interface ViewModelLocation {
  id: string;
  type: "folder" | "resourceHub";
}

//
// A node in the file explorer. This can be any node type, including folders,
// files, documents, and links.
//
// A node can be selectable, which means that it can be clicked on to open it.
// When we click on the node, the loading flag is set to the node's ID, and the
// node is expanded to show its children when the server responds with the
// folder's contents.
//
export interface ViewModelNode {
  id: string;
  selectable: boolean;
  name: string;
  type: Hub.ResourceHubNode["type"];
  resource: Hub.Resource;
  apiNode?: Hub.ResourceHubNode;
  parent?: ViewModelNode;
}

export type NotAllowedSelection = { id: string; type: ViewModelNode["type"] };

export function useViewModel(fieldName: string, notAllowedSelections?: NotAllowedSelection[]): ViewModel {
  //
  // Integrate with the Forms module to manage the state of the form.
  //
  const [location, setValue] = useFieldValue<ViewModelLocation>(fieldName);
  const error = useFieldError(fieldName);

  const [currentNode, setCurrentNode] = React.useState<ViewModelNode | undefined>();
  const [nodes, setNodes] = React.useState<ViewModelNode[]>([]);
  const [loading, setLoading] = React.useState<ViewModelLocation | undefined>();

  //
  // Every time the field changes, we need to update the current node and the
  // list of nodes in the file explorer.
  //
  React.useEffect(() => {
    setLoading(location);

    const loader = new NodeLoader(location, notAllowedSelections);

    loader
      .load()
      .then(([node, nodes]) => {
        setCurrentNode(node);
        setNodes(nodes);
      })
      .finally(() => {
        setLoading(undefined);
      });
  }, [location]);

  //
  // Select a node to explore in the file explorer.
  //
  const select = (node: ViewModelNode) => {
    if (!node.selectable) return;
    setValue(nodeToLocation(node));
  };

  const isNodeLoading = (node: ViewModelNode) => {
    if (!loading) return false;
    return compareIds(loading.id, node.resource.id);
  };

  return {
    error,
    select,
    isNodeLoading,

    currentNode,
    nodes,
  };
}

function nodeToLocation(node: ViewModelNode): ViewModelLocation {
  return {
    id: node.resource.id!,
    type: node.type === "folder" ? "folder" : "resourceHub",
  };
}

class NodeLoader {
  constructor(
    private location: ViewModelLocation,
    private preventSelection?: NotAllowedSelection[],
  ) {}

  async load(): Promise<[ViewModelNode, ViewModelNode[]]> {
    if (this.location.type === "folder") {
      return this.loadFolderContent();
    } else {
      return this.loadResourceHubContent();
    }
  }

  async loadFolderContent(): Promise<[ViewModelNode, ViewModelNode[]]> {
    const res = await Hub.getResourceHubFolder({
      id: this.location.id,
      includeNodes: true,
      includePathToFolder: true,
      includeResourceHub: true,
    });

    const node = this.apiFolderToNode(res.folder!);
    const subnodes = this.apiNodesToViewModelNodes(res.folder!.nodes!);

    return [node, subnodes];
  }

  async loadResourceHubContent(): Promise<[ViewModelNode, ViewModelNode[]]> {
    const res = await Hub.getResourceHub({ id: this.location.id, includeNodes: true });

    const node = this.apiResourceHubToNode(res.resourceHub!);
    const subnodes = this.apiNodesToViewModelNodes(res.resourceHub!.nodes!);

    return [node, subnodes];
  }

  apiFolderToNode(folder: Hub.ResourceHubFolder): ViewModelNode {
    return {
      id: folder!.id!,
      selectable: this.selectionAllowed("folder", folder!),
      name: folder!.name!,
      type: "folder",
      resource: folder!,
      parent: this.apiFolderToNodeParent(folder),
    };
  }

  apiResourceHubToNode(resourceHub: Hub.ResourceHub): ViewModelNode {
    return {
      id: resourceHub!.id!,
      selectable: true,
      name: resourceHub!.name!,
      type: "resourceHub",
      resource: resourceHub!,
    };
  }

  apiFolderToNodeParent(folder: Hub.ResourceHubFolder): ViewModelNode {
    if (folder!.pathToFolder!.length > 0) {
      const parent = folder!.pathToFolder!.slice(-1)[0];

      return {
        id: parent!.id!,
        selectable: this.selectionAllowed("folder", folder!.pathToFolder!.slice(-1)[0]!),
        name: parent!.name!,
        type: "folder",
        resource: parent!,
      };
    } else {
      return {
        id: folder!.resourceHub!.id!,
        selectable: true,
        name: folder!.resourceHub!.name!,
        type: "resourceHub",
        resource: folder!.resourceHub!,
      };
    }
  }

  apiNodesToViewModelNodes(nodes: Hub.ResourceHubNode[]): ViewModelNode[] {
    return sortNodesWithFoldersFirst(nodes).map((node) => {
      const resource = this.findResource(node);

      return {
        id: node.id!,
        selectable: this.selectionAllowed(node.type! as Hub.ResourceTypeName, resource),
        name: node.name!,
        type: "folder",
        resource: resource,
        apiNode: node,
      };
    });
  }

  selectionAllowed(resourceType: Hub.ResourceTypeName, resource: Hub.Resource): boolean {
    return resourceType === "folder" && !this.preventSelection?.some((loc) => loc.id === resource.id);
  }

  findResource(node: Hub.ResourceHubNode): Hub.Resource {
    return match(node.type)
      .with("folder", () => node.folder!)
      .with("file", () => node.file!)
      .with("document", () => node.document!)
      .with("link", () => node.link!)
      .run();
  }
}
