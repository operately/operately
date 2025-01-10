import { Node } from "./node";

export interface NodesListModel {
  isEmpty: boolean; // no nodes to display
  isRoot: boolean; // showing root of the resource hub

  nodes: Node[];
}

export function useNodeListViewModel(): NodesListModel {
  return {
    isEmpty: true,
    isRoot: true,

    nodes: [],
  };
}
