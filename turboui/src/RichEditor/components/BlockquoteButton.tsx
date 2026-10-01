import { useTranslation } from "react-i18next";
import * as React from "react";
import { IconBlockquote } from "../../icons";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function BlockquoteButton({ editor, iconSize }): JSX.Element {
  const { t } = useTranslation();
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleBlockquote().run()}
      isActive={editor?.isActive("blockquote")}
      title={t("Quote")}
    >
      <IconBlockquote size={iconSize} />
    </ToolbarToggleButton>
  );
}
