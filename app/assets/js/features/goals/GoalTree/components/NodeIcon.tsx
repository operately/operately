import * as React from "react";
import { IconTarget, IconHexagons } from "turboui";

import { Node } from "../tree";

export function NodeIcon({ node }: { node: Pick<Node, "type"> }) {
  switch (node.type) {
    case "goal":
      return <IconTarget size={15} className="text-content-error shrink-0" />;
    case "project":
      return <IconHexagons size={15} className="text-indigo-500 shrink-0" />;
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}
