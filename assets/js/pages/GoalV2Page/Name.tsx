import React from "react";

import Forms from "@/components/Forms";
import { useIsViewMode } from "@/components/Pages";

export function GoalName() {
  const isViewMode = useIsViewMode();

  return (
    <Forms.FieldGroup>
      <Forms.TitleInput
        field="name"
        placeholder="Goal title..."
        errorMessage="Please add a title"
        readonly={isViewMode}
        fontBold
      />
    </Forms.FieldGroup>
  );
}
