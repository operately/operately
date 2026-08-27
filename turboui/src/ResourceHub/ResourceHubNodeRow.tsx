import * as React from "react";

import { CommentCountIndicator } from "../CommentCountIndicator";
import type { FormattedTimePreferences } from "../FormattedTime";
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
  formattedTimePreferences?: FormattedTimePreferences;
}

export function ResourceHubNodeRow({
  node,
  path,
  testId,
  actions,
  className,
  formattedTimePreferences,
}: ResourceHubNodeRowProps) {
  const rowClassName = classNames(
    "flex justify-between gap-2 py-4 px-2 items-center",
    "border-b border-stroke-base",
    className,
  );

  return (
    <div className={rowClassName} data-test-id={testId}>
      <DivLink to={path} className="flex min-w-0 flex-1 cursor-pointer items-center gap-4">
        <NodeIcon node={node} size={48} />

        <div className="min-w-0">
          <div className="truncate text-base font-bold">{getNodeName(node)}</div>
          <NodeDescription node={node} formattedTimePreferences={formattedTimePreferences} />
        </div>
      </DivLink>

      <CommentCountIndicator count={getNodeCommentsCount(node)} size={24} />
      {actions}
    </div>
  );
}
