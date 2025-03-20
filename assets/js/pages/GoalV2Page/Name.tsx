import React from "react";

import Forms from "@/components/Forms";
import { useIsViewMode } from "@/components/Pages";

export function GoalName() {
  const isViewMode = useIsViewMode();

  return (
    <Forms.FieldGroup>
      <Forms.TitleInput field="name" readonly={isViewMode} fontBold />
    </Forms.FieldGroup>
  );
}
