import * as React from "react";

import { CommentCountIndicator } from "../CommentCountIndicator";
import { DivLink } from "../Link";
import classNames from "../utils/classnames";
import { NodeDescription } from "./NodeDescription";
import { NodeIcon } from "./NodeIcon";
import { getNodeCommentsCount, getNodeName } from "./selectors";
import type { ResourceHubNode } from "./types";

interface ResourceHubNodeRowProps {
  node: ResourceHubNode;
  path: string;
  testId: string;
  actions?: React.ReactNode;
  className?: string;
}

export function ResourceHubNodeRow({ node, path, testId, actions, className }: ResourceHubNodeRowProps) {
  const rowClassName = classNames(
    "flex justify-between gap-2 py-4 px-2 items-center",
    "border-b border-stroke-base",
    className,
  );

  return (
    <div className={rowClassName} data-test-id={testId}>
      <DivLink to={path} className="flex gap-4 items-center cursor-pointer flex-1">
        <NodeIcon node={node} size={48} />

        <div>
          <div className="font-bold text-base">{getNodeName(node)}</div>
          <NodeDescription node={node} />
        </div>
      </DivLink>

      <CommentCountIndicator count={getNodeCommentsCount(node)} size={24} />
      {actions}
    </div>
  );
}
