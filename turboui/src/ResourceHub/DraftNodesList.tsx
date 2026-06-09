import * as React from "react";
import classNames from "../utils/classnames";
import { CommentCountIndicator } from "../CommentCountIndicator";
import { DivLink } from "../Link";
import { NodeDescription } from "./NodeDescription";
import { NodeIcon } from "./NodeIcon";
import type { ResourceHubDraftNode } from "./types";

interface DraftNodesListProps {
  nodes: ResourceHubDraftNode[];
}

export function DraftNodesList({ nodes }: DraftNodesListProps) {
  return (
    <div className="md:m-6">
      {nodes.map((node, index) => (
        <NodeItem node={node} testId={`node-${index}`} key={node.id} />
      ))}
    </div>
  );
}

function NodeItem({ node, testId }: { node: ResourceHubDraftNode; testId: string }) {
  const className = classNames("flex justify-between gap-2 py-4 px-2 items-center", "border-b border-stroke-base first:border-t-0");

  return (
    <div className={className} data-test-id={testId}>
      <DivLink to={node.path} className="flex gap-4 items-center cursor-pointer flex-1">
        <NodeIcon node={node} size={48} />

        <div>
          <NodeName node={node} />
          <NodeDescription node={node} />
        </div>
      </DivLink>

      <CommentCountIndicator count={node.commentsCount} size={24} />
    </div>
  );
}

function NodeName({ node }: { node: ResourceHubDraftNode }) {
  return <div className="font-bold text-base">{node.name}</div>;
}
