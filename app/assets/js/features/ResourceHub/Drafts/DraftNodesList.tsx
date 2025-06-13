import React from "react";

import { ResourceHubNode } from "@/models/resourceHubs";

import { CommentsCountIndicator } from "@/features/Comments";
import { NodeDescription } from "@/features/ResourceHub/NodeDescription";
import { NodeIcon } from "@/features/ResourceHub/NodeIcon";
import { findCommentsCount, findPath, NodeType } from "@/features/ResourceHub/utils";
import { usePaths } from "@/routes/paths";
import { createTestId } from "@/utils/testid";
import classNames from "classnames";
import { DivLink } from "turboui";

interface Props {
  nodes: ResourceHubNode[];
}

export function DraftNodesList({ nodes }: Props) {
  return (
    <div className="md:m-6">
      {nodes.map((node, idx) => (
        <NodeItem node={node} testid={createTestId("node", idx.toString())} key={node.id} />
      ))}
    </div>
  );
}

interface NodeItemProps {
  node: ResourceHubNode;
  testid?: string;
}

function NodeItem({ node, testid }: NodeItemProps) {
  const paths = usePaths();
  const className = classNames(
    "flex justify-between gap-2 py-4 px-2 items-center",
    "border-b border-stroke-base first:border-t-0",
  );

  const path = findPath(paths, node.type as NodeType, node);
  const commentsCount = findCommentsCount(node.type as NodeType, node);

  return (
    <div className={className} data-test-id={testid}>
      <DivLink to={path} className="flex gap-4 items-center cursor-pointer flex-1">
        <NodeIcon node={node} size={48} />

        <div>
          <NodeName node={node} />
          <NodeDescription node={node} />
        </div>
      </DivLink>

      <CommentsCountIndicator count={commentsCount} size={24} />
    </div>
  );
}

function NodeName({ node }: NodeItemProps) {
  return <div className="font-bold text-base">{node.name}</div>;
}
