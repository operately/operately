import React from "react";

import Forms from "@/components/Forms";
import { useFieldValue } from "@/components/Forms/FormContext";
import { useIsViewMode } from "@/components/Pages";
import { richContentToString } from "@/components/RichContent";

import { useLoadedData } from "./loader";

export function Description() {
  const { goal } = useLoadedData();
  const isViewMode = useIsViewMode();
  const [description] = useFieldValue("description");

  const mentionSearchScope = { type: "goal", id: goal.id! } as const;
  const strDescription = description ? richContentToString(description).trim() : "";

  if (!strDescription && isViewMode) return null;

  return (
    <Forms.FieldGroup>
      <Forms.RichTextArea
        field="description"
        placeholder="Write here..."
        mentionSearchScope={mentionSearchScope}
        readonly={isViewMode}
        height="3rem"
        horizontalPadding=""
        verticalPadding=""
        hideBorder
        hideToolbar
      />
    </Forms.FieldGroup>
  );
}
