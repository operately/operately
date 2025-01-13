import * as React from "react";

import { BeatLoader } from "react-spinners";

import { IconArrowLeft } from "@tabler/icons-react";
import { NodeIcon } from "@/features/ResourceHub/NodeIcon";

import { useViewModel, ViewModel, ViewModelNode, NotAllowedSelection } from "./viewModel";
import classNames from "classnames";

interface FolderSelectFieldProps {
  field: string;
  notAllowedSelections?: NotAllowedSelection[];
}

export function FolderSelectField({ field, notAllowedSelections }: FolderSelectFieldProps) {
  const viewModel = useViewModel(field, notAllowedSelections || []);

  return (
    <div>
      <Navigation viewModel={viewModel} />
      <NodeList viewModel={viewModel} />
      <Error error={viewModel.error} />
    </div>
  );
}

function Navigation({ viewModel }: { viewModel: ViewModel }) {
  if (!viewModel.currentNode) return <></>;

  return (
    <div className="h-8 flex items-center gap-2 pb-2 border-b border-stroke-base">
      <NavigateBack viewModel={viewModel} />
      <div className="text-lg">{viewModel.currentNode!.name}</div>
    </div>
  );
}

function NavigateBack({ viewModel }: { viewModel: ViewModel }) {
  if (!viewModel.currentNode) return null;
  if (!viewModel.currentNode.parent) return null;

  return (
    <IconArrowLeft
      className="cursor-pointer"
      size={20}
      onClick={() => viewModel.select(viewModel.currentNode!.parent!)}
    />
  );
}

function NodeList({ viewModel }: { viewModel: ViewModel }) {
  return (
    <div className="h-[240px] overflow-scroll">
      {viewModel.nodes?.map((node, index) => (
        <NodeItem viewModel={viewModel} node={node} key={node.id} index={index} />
      ))}
    </div>
  );
}

function NodeItem({ viewModel, node, index }: { viewModel: ViewModel; node: ViewModelNode; index: number }) {
  const className = classNames("flex items-center justify-between p-2", {
    "cursor-pointer": node.selectable,
    "opacity-40": !node.selectable,
    "hover:bg-surface-highlight": !viewModel.isNodeLoading(node),
  });

  return (
    <div className={className} onClick={() => viewModel.select(node)} data-test-id={`node-${index}`}>
      <div className="flex items-center gap-2">
        <NodeIcon size={18} node={node.apiNode!} />
        {node.name}
      </div>

      {viewModel.isNodeLoading(node) && <BeatLoader size={4} />}
    </div>
  );
}

function Error({ error }) {
  if (!error) return <></>;
  return <div className="translate-y-6 text-sm text-red-500">{error}</div>;
}
