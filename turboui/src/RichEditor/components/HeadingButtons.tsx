import type { Editor } from "@tiptap/core";
import React from "react";
import { useTranslation } from "react-i18next";
import { IconH2, IconH3, IconH4 } from "../../icons";
import { EDITOR_HEADING_LEVELS } from "../extensions/Heading";
import { ToolbarToggleButton } from "./ToolbarToggleButton";

const HEADING_ICONS = { 2: IconH2, 3: IconH3, 4: IconH4 };

export function HeadingButtons({ editor, iconSize }: { editor: Editor; iconSize: number }): JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      {EDITOR_HEADING_LEVELS.map((level) => {
        const Icon = HEADING_ICONS[level];

        return (
          <ToolbarToggleButton
            key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            isActive={editor.isActive("heading", { level })}
            title={t("Heading {{level}}", { level })}
          >
            <Icon size={iconSize} />
          </ToolbarToggleButton>
        );
      })}
    </>
  );
}
