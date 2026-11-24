import type { Editor } from "@tiptap/react";
import React from "react";
import { useTranslation } from "react-i18next";

import { IconBinaryTree2 } from "../../icons";
import { ToolbarButton } from "./ToolbarButton";

export function MermaidButton({ editor, iconSize, tabIndex }: { editor: Editor; iconSize: number; tabIndex?: number }) {
  const { t } = useTranslation();
  const title = t("Insert diagram");

  return (
    <ToolbarButton
      title={title}
      aria-label={title}
      tabIndex={tabIndex}
      onClick={() => editor.chain().focus().setCodeBlock({ language: "mermaid" }).run()}
    >
      <IconBinaryTree2 size={iconSize} />
    </ToolbarButton>
  );
}
