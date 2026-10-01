import { useTranslation } from "react-i18next";
import React from "react";
import type { Editor } from "@tiptap/core";
import { IconListCheck } from "../../icons";
import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function TaskListButton({ editor, iconSize }: { editor: Editor | null; iconSize: number }) {
  const { t } = useTranslation();
  return (
    <ToolbarToggleButton
      onClick={() => editor?.chain().focus().toggleTaskList().run()}
      isActive={editor?.isActive("taskList")}
      title={t("Task list")}
    >
      <IconListCheck size={iconSize} />
    </ToolbarToggleButton>
  );
}
