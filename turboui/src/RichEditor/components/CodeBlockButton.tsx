import { useTranslation } from "react-i18next";
import * as React from "react";

import { IconCode } from "../../icons";
import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function CodeBlockButton({ editor, iconSize }): JSX.Element {
  const { t } = useTranslation();
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      isActive={editor?.isActive("codeblock")}
      title={t("Code Block")}
    >
      <IconCode size={iconSize - 2} />
    </ToolbarToggleButton>
  );
}
