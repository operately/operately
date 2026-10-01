import { useTranslation } from "react-i18next";
import * as React from "react";
import { IconStrikethrough } from "../../icons";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function StrikeButton({ editor, iconSize }): JSX.Element {
  const { t } = useTranslation();
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleStrike().run()}
      isActive={editor?.isActive("strike")}
      title={t("Strikethrough")}
    >
      <IconStrikethrough size={iconSize} />
    </ToolbarToggleButton>
  );
}
