import * as React from "react";

import { DivLink } from "@/components/Link";
import { Node } from "../tree";

import classNames from "classnames";

interface NodeNameProps {
  node: Node;
  target?: React.HTMLAttributeAnchorTarget;
}

export function NodeName({ node, target = "_self" }: NodeNameProps) {
  const titleClass = classNames({
    "font-bold": node.depth === 0,
    "font-medium": node.depth > 0,
    "hover:underline": true,
    "decoration-content-subtle": true,
    truncate: true,
  });

  return (
    <DivLink to={node.linkTo} className={titleClass} target={target}>
      {node.name}
    </DivLink>
  );
}
