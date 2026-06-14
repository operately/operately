import * as React from "react";

import { BeatLoader } from "react-spinners";
import classNames from "classnames";

import { InputField } from "../../Forms";
import { IconArrowLeft } from "../../icons";
import { NodeIcon } from "../NodeIcon";
import { createTestId } from "../../TestableElement";
import type { ResourceHubFolderSelectFieldProps } from "../types";
import { useViewModel, type ViewModel } from "./viewModel";

export function FolderSelectField({ label, field, notAllowedSelections }: ResourceHubFolderSelectFieldProps) {
  const viewModel = useViewModel(field, notAllowedSelections);

  return (
    <InputField label={label} field={field} error={viewModel.error}>
      <div className="border border-surface-outline rounded-lg">
        <Navigation viewModel={viewModel} />
        <NodeList viewModel={viewModel} />
      </div>
    </InputField>
  );
}

function Navigation({ viewModel }: { viewModel: ViewModel }) {
  if (!viewModel.currentNode) return <></>;

  return (
    <div className="h-8 flex items-center gap-2 p-2 border-b border-stroke-base">
      <NavigateBack viewModel={viewModel} />
      <div className="text-sm" data-test-id={createTestId("folder-select-current", viewModel.currentNode.id)}>
        {viewModel.currentNode.name}
      </div>
    </div>
  );
}

function NavigateBack({ viewModel }: { viewModel: ViewModel }) {
  const parent = viewModel.currentNode?.parent;

  if (!parent) return null;

  return (
    <IconArrowLeft
      className="cursor-pointer"
      size={16}
      onClick={() => viewModel.select(parent)}
      data-test-id="folder-select-go-back"
    />
  );
}

function NodeList({ viewModel }: { viewModel: ViewModel }) {
  return (
    <div className="h-[240px] overflow-auto">
      {viewModel.nodes?.map((node) => (
        <NodeItem viewModel={viewModel} node={node} key={node.id} />
      ))}
    </div>
  );
}

function NodeItem({ viewModel, node }: { viewModel: ViewModel; node: ViewModel["nodes"][number] }) {
  const className = classNames("flex items-center justify-between", "p-2", "even:bg-surface-dimmed", {
    "cursor-pointer": node.selectable,
    "hover:bg-surface-highlight": !viewModel.isNodeLoading(node),
  });

  const innerClassName = classNames("flex items-center gap-2 text-sm", {
    "opacity-40": !node.selectable,
  });
  const testId = node.selectable ? createTestId("folder-select-node", node.id) : undefined;

  return (
    <div className={className} onClick={() => viewModel.select(node)} data-test-id={testId}>
      <div className={innerClassName}>
        {node.iconNode && <NodeIcon size={16} node={node.iconNode} />}
        {node.name}
      </div>

      {viewModel.isNodeLoading(node) && <BeatLoader size={4} />}
    </div>
  );
}
