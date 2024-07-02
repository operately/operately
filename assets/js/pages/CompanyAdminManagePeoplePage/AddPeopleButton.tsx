import * as React from "react";
import { GhostButton } from "@/components/Button";
import { Paths } from "@/routes/paths";

export function AddPeopleButton() {
  const addPeoplePath = Paths.companyManagePeopleAddPeoplePath();

  return (
    <div className="flex items-center my-8 gap-2">
      <div className="h-px bg-surface-outline flex-1" />
      <GhostButton type="primary" linkTo={addPeoplePath} testId="add-person">
        Add a Member
      </GhostButton>
      <div className="h-px bg-surface-outline flex-1" />
    </div>
  );
}
