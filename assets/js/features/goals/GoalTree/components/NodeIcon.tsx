import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { Node } from "../tree";

export function NodeIcon({ node }: { node: Pick<Node, "type"> }) {
  switch (node.type) {
    case "goal":
      return (
        <div className="bg-red-500/10 p-1.5 rounded-lg">
          <Icons.IconTargetArrow size={18} className="shrink-0 text-red-500" />
        </div>
      );
    case "project":
      return (
        <div className="bg-indigo-500/10 p-1.5 rounded-lg">
          <Icons.IconHexagons size={18} className="text-indigo-500 shrink-0" />
        </div>
      );
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}
