import { useTranslation } from "react-i18next";
import * as React from "react";
import { IconItalic } from "../../icons";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function ItalicButton({ editor, iconSize }): JSX.Element {
  const { t } = useTranslation();
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleItalic().run()}
      isActive={editor?.isActive("italic")}
      title={t("Italic")}
    >
      <IconItalic size={iconSize} />
    </ToolbarToggleButton>
  );
}
