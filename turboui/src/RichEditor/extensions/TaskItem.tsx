import React from "react";
import { TaskItem } from "@tiptap/extension-list";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { Checkbox } from "../../Checkbox";

export const TaskListContext = React.createContext<{
  canEdit: boolean;
  pending: boolean;
  onChange: (path: number[], checked: boolean) => void;
}>({ canEdit: false, pending: false, onChange: () => {} });

function TaskItemView({ node, editor, getPos, updateAttributes }: NodeViewProps) {
  const interaction = React.useContext(TaskListContext);
  const disabled = !editor.isEditable && (!interaction.canEdit || interaction.pending);

  function change(checked: boolean) {
    if (disabled) return;
    if (editor.isEditable) {
      updateAttributes({ checked });
      return;
    }

    const position = getPos();
    if (position === undefined) return;
    const resolved = editor.state.doc.resolve(position);
    const path = Array.from({ length: resolved.depth + 1 }, (_, depth) => resolved.index(depth));
    interaction.onChange(path, checked);
  }

  return (
    <NodeViewWrapper
      as="li"
      data-type="taskItem"
      data-checked={node.attrs.checked}
      className="!flex !list-none gap-2 !my-1"
    >
      <span contentEditable={false} className="mt-1 shrink-0" aria-busy={interaction.pending}>
        <Checkbox
          checked={node.attrs.checked === true}
          onChange={change}
          disabled={disabled}
          label={node.firstChild?.textContent || "Task item"}
          size="sm"
          testId="task-list-checkbox"
        />
      </span>
      <NodeViewContent className="min-w-0 flex-1 [&>p]:!my-0" />
    </NodeViewWrapper>
  );
}

export const TaskItemExtension = TaskItem.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TaskItemView);
  },
}).configure({ nested: true });
