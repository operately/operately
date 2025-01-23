import * as React from "react";

import { BeatLoader } from "react-spinners";

import { IconArrowLeft } from "@tabler/icons-react";
import { NodeIcon } from "@/features/ResourceHub/NodeIcon";

import { useViewModel, ViewModel, ViewModelNode, NotAllowedSelection } from "./viewModel";
import classNames from "classnames";
import Forms from "@/components/Forms";
import { createTestId } from "@/utils/testid";

interface FolderSelectFieldProps {
  label: string;
  field: string;
  notAllowedSelections?: NotAllowedSelection[];
}

export function FolderSelectField({ label, field, notAllowedSelections }: FolderSelectFieldProps) {
  const viewModel = useViewModel(field, notAllowedSelections || []);

  return (
    <Forms.InputField label={label} field={field} error={viewModel.error}>
      <div className="border border-surface-outline rounded-lg">
        <Navigation viewModel={viewModel} />
        <NodeList viewModel={viewModel} />
      </div>
    </Forms.InputField>
  );
}

function Navigation({ viewModel }: { viewModel: ViewModel }) {
  if (!viewModel.currentNode) return <></>;

  return (
    <div className="h-8 flex items-center gap-2 p-2 border-b border-stroke-base">
      <NavigateBack viewModel={viewModel} />
      <div className="text-sm">{viewModel.currentNode!.name}</div>
    </div>
  );
}

function NavigateBack({ viewModel }: { viewModel: ViewModel }) {
  if (!viewModel.currentNode) return null;
  if (!viewModel.currentNode.parent) return null;

  return (
    <IconArrowLeft
      className="cursor-pointer"
      size={16}
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
  const className = classNames("flex items-center justify-between", "p-2", "even:bg-surface-dimmed", {
    "cursor-pointer": node.selectable,
    "hover:bg-surface-highlight": !viewModel.isNodeLoading(node),
  });

  const innerClassName = classNames("flex items-center gap-2 text-sm", {
    "opacity-40": !node.selectable,
  });
  const testId = createTestId(node.name, index.toString());

  return (
    <div className={className} onClick={() => viewModel.select(node)} data-test-id={testId}>
      <div className={innerClassName}>
        <NodeIcon size={16} node={node.apiNode!} />
        {node.name}
      </div>

      {viewModel.isNodeLoading(node) && <BeatLoader size={4} />}
    </div>
  );
}
