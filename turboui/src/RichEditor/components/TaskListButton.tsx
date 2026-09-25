import React from "react";
import type { Editor } from "@tiptap/core";
import { IconListCheck } from "../../icons";
import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function TaskListButton({ editor, iconSize }: { editor: Editor | null; iconSize: number }) {
  return (
    <ToolbarToggleButton
      onClick={() => editor?.chain().focus().toggleTaskList().run()}
      isActive={editor?.isActive("taskList")}
      title="Task list"
    >
      <IconListCheck size={iconSize} />
    </ToolbarToggleButton>
  );
}
