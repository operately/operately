import { useTranslation } from "react-i18next";
import React from "react";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

import { IconLink2 } from "../../icons";
import { useLinkState } from "../EditorContext";

export function LinkButton({ editor, iconSize }): JSX.Element {
  const { t } = useTranslation();
  const [linkEditActive, setLinkEditActive] = useLinkState();

  return (
    <ToolbarToggleButton
      onClick={() => setLinkEditActive((active) => !active)}
      isActive={editor?.isActive("link") || linkEditActive}
      title={t("Add/Edit Links")}
    >
      <IconLink2 size={iconSize - 2} />
    </ToolbarToggleButton>
  );
}
