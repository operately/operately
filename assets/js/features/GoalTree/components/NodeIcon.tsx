import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { Node } from "../tree";

export function NodeIcon({ node }: { node: Node }) {
  switch (node.type) {
    case "goal":
      return <Icons.IconTarget size={15} className="text-red-500 shrink-0" />;
    case "project":
      return <Icons.IconHexagons size={15} className="text-indigo-500 shrink-0" />;
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}
