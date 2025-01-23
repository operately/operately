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
  const titleClass = classNames("decoration-content-subtle hover:underline truncate");

  return (
    <div className="flex items-center gap-1 truncate">
      <DivLink to={node.linkTo()} className={titleClass} target={target}>
        {node.name}
      </DivLink>

      {node.type === "project" && <PrivacyIndicator project={(node as ProjectNode).project} size={16} />}
    </div>
  );
}
