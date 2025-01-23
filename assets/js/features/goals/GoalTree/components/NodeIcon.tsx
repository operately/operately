import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { Node } from "../tree";

export function NodeIcon({ node }: { node: Pick<Node, "type"> }) {
  switch (node.type) {
    case "goal":
      return (
        <div className="bg-red-100 p-1 rounded-lg">
          <Icons.IconTarget size={16} className="text-content-error shrink-0" />
        </div>
      );
    case "project":
      return (
        <div className="bg-indigo-100 p-1 rounded-lg">
          <Icons.IconHexagons size={16} className="text-indigo-500 shrink-0" />
        </div>
      );
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}
