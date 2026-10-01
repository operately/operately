import { useTranslation } from "react-i18next";
import * as React from "react";
import { IconList } from "../../icons";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function BulletListButton({ editor, iconSize }): JSX.Element {
  const { t } = useTranslation();
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleBulletList().run()}
      isActive={editor?.isActive("bulletList")}
      title={t("Bullet List")}
    >
      <IconList size={iconSize} />
    </ToolbarToggleButton>
  );
}
