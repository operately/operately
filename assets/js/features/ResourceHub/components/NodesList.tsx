import React from "react";
import classNames from "classnames";

import { DivLink } from "@/components/Link";
import { CommentsCountIndicator } from "@/features/Comments";
import { DocumentMenu, FileMenu, FolderMenu, FolderZeroNodes, HubZeroNodes, LinkMenu } from ".";
import { NodeIcon } from "../NodeIcon";
import { NodeDescription } from "../NodeDescription";

import { NodesListModel, Node } from "@/features/ResourceHub/models";
import { match } from "ts-pattern";

export function NodesList({ viewModel }: { viewModel: NodesListModel }) {
  if (viewModel.isEmpty) {
    return <ZeroState viewModel={viewModel} />;
  } else {
    return <RegularState viewModel={viewModel} />;
  }
}

function RegularState({ viewModel }: { viewModel: NodesListModel }) {
  return (
    <div className="md:m-6">
      {viewModel.nodes.map((node) => (
        <NodeItem node={node} key={node.id} />
      ))}
    </div>
  );
}

function ZeroState({ viewModel }: { viewModel: NodesListModel }) {
  if (viewModel.isRoot) {
    return <HubZeroNodes />;
  } else {
    return <FolderZeroNodes />;
  }
}

function NodeItem({ node }: { node: Node }) {
  return (
    <NodeItemContainer node={node}>
      <NodeLeftSide node={node} />
      <NodeRightSide node={node} />
    </NodeItemContainer>
  );
}

function NodeLeftSide({ node }: { node: Node }) {
  const className = classNames("flex gap-4 items-center cursor-pointer flex-1");

  return (
    <DivLink to={node.viewPath} className={className}>
      <NodeIcon node={node} size={48} />
      <NodeNameAndDescription node={node} />
    </DivLink>
  );
}

function NodeNameAndDescription({ node }: { node: Node }) {
  return (
    <div>
      <NodeName node={node} />
      <NodeDescription node={node} />
    </div>
  );
}

function NodeRightSide({ node }: { node: Node }) {
  return (
    <div className="flex items-center gap-2">
      <CommentsCountIndicator count={node.commentsCount} size={24} />
      <NodeMenu node={node} />
    </div>
  );
}

function NodeItemContainer({ node, children }: { node: Node; children: React.ReactNode }) {
  const className = classNames(
    "flex justify-between items-center gap-2",
    "py-4 px-2",
    "border-b border-stroke-base first:border-t-0",
  );

  return <div className={className} data-test-id={node.testId} children={children} />;
}

function NodeName({ node }: { node: Node }) {
  return <div className="font-bold text-base">{node.name}</div>;
}

function NodeMenu({ node }: { node: Node }) {
  return match(node.type)
    .with("folder", () => <FolderMenu node={node} />)
    .with("file", () => <FileMenu node={node} />)
    .with("document", () => <DocumentMenu node={node} />)
    .with("link", () => <LinkMenu node={node} />)
    .exhaustive();
}
