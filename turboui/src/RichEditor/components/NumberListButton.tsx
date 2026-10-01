import { useTranslation } from "react-i18next";
import * as React from "react";
import { IconListNumbers } from "../../icons";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function NumberListButton({ editor, iconSize }): JSX.Element {
  const { t } = useTranslation();
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleOrderedList().run()}
      isActive={editor?.isActive("orderedList")}
      title={t("Numbered List")}
    >
      <IconListNumbers size={iconSize} />
    </ToolbarToggleButton>
  );
}
