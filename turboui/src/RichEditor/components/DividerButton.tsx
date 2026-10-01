import { useTranslation } from "react-i18next";
import * as React from "react";

import { IconMinus } from "../../icons";

import { ToolbarButton } from "./ToolbarButton";

export function DividerButton({ editor, iconSize }): JSX.Element {
  const { t } = useTranslation();
  return (
    <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title={t("Divider")}>
      <IconMinus size={iconSize} />
    </ToolbarButton>
  );
}
