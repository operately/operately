import React, { useMemo } from "react";

import classNames from "classnames";
import { DivLink } from "@/components/Link";
import { CommentsCountIndicator } from "@/features/Comments";
import { createTestId } from "@/utils/testid";
import { sortNodesWithFoldersFirst } from "./utils";
import { DocumentMenu, FileMenu, FolderMenu, LinkMenu } from "./components";
import { NodeIcon } from "./NodeIcon";
import { NodeDescription } from "./NodeDescription";
import { DecoratedNode } from "./DecoratedNode";
import { match } from "ts-pattern";

export function NodesList({ nodes }: { nodes: DecoratedNode[]; refresh: () => void }) {
  let sorted = useMemo(() => sortNodesWithFoldersFirst(nodes), [nodes]);

  return (
    <div className="md:m-6">
      {sorted.map((node, idx) => (
        <NodeItem node={node} testid={createTestId("node", idx.toString())} key={node.resource.id} />
      ))}
    </div>
  );
}

interface NodeItemProps {
  node: DecoratedNode;
  testid: string;
}

function NodeItem({ node, testid }: NodeItemProps) {
  const className = classNames(
    "flex justify-between gap-2 py-4 px-2 items-center",
    "border-b border-stroke-base first:border-t-0",
  );

  return (
    <div className={className} data-test-id={testid}>
      <DivLink to={node.link} className="flex gap-4 items-center cursor-pointer flex-1">
        <NodeIcon node={node.rawNode} size={48} />

        <div>
          <NodeName node={node} />
          <NodeDescription node={node} />
        </div>
      </DivLink>

      <CommentsCountIndicator count={node.commentsCount!} size={24} />
      <NodeMenu node={node} />
    </div>
  );
}

function NodeName({ node }: { node: DecoratedNode }) {
  return <div className="font-bold text-base">{node.name}</div>;
}

function NodeMenu({ node }: { node: DecoratedNode }) {
  return (
    <div className="flex items-center">
      {match(node.type)
        .with("folder", () => <FolderMenu node={node} />)
        .with("document", () => <DocumentMenu node={node} />)
        .with("file", () => <FileMenu node={node} />)
        .with("link", () => <LinkMenu node={node} />)
        .exhaustive()}
    </div>
  );
}
