import * as React from "react";

import { DivLink } from "@/components/Link";
import { Node, ProjectNode } from "../tree";

import classNames from "classnames";
import { PrivacyIndicator } from "@/features/projects/PrivacyIndicator";

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
    <div className="flex items-center gap-1">
      <DivLink to={node.linkTo()} className={titleClass} target={target}>
        {node.name}
      </DivLink>

      {node.type === "project" && <PrivacyIndicator project={(node as ProjectNode).project} size={16} />}
    </div>
  );
}
