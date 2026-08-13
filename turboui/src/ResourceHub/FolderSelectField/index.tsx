import React from "react";

import { FolderSelectField } from "../../FolderSelectField";
import { NodeIcon } from "../NodeIcon";
import type { ResourceHubFolderSelectFieldProps } from "../types";
import { useViewModel } from "./viewModel";

export function ResourceHubFolderSelectField({
  label,
  field,
  notAllowedSelections,
}: ResourceHubFolderSelectFieldProps) {
  const viewModel = useViewModel(field, notAllowedSelections);
  const parent = viewModel.currentNode?.parent;

  return (
    <FolderSelectField
      label={label}
      field={field}
      error={viewModel.error}
      current={viewModel.currentNode ? { id: viewModel.currentNode.id, name: viewModel.currentNode.name } : null}
      onGoBack={parent ? () => viewModel.select(parent) : undefined}
      nodes={viewModel.nodes.map((node) => ({
        id: node.id,
        name: node.name,
        selectable: node.selectable,
        loading: viewModel.isNodeLoading(node),
        icon: node.iconNode ? <NodeIcon size={16} node={node.iconNode} /> : null,
        onSelect: () => viewModel.select(node),
      }))}
    />
  );
}
