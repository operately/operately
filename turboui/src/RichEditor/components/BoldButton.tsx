import { useTranslation } from "react-i18next";
import * as React from "react";
import { IconBold } from "../../icons";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function BoldButton({ editor, iconSize }): JSX.Element {
  const { t } = useTranslation();
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleBold().run()}
      isActive={editor?.isActive("bold")}
      title={t("Bold")}
    >
      <IconBold size={iconSize} strokeWidth={2.2} />
    </ToolbarToggleButton>
  );
}
