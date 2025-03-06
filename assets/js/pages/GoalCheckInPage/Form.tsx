import React from "react";

import * as Pages from "@/components/Pages";

import { EditBar } from "@/components/Pages/EditBar";
import { useForm, Form as CheckInForm } from "@/features/goals/GoalCheckIn";
import { useLoadedData } from "./loader";

export function Form() {
  const { update, goal } = useLoadedData();
  const isViewMode = Pages.useIsViewMode();

  const form = useForm({ mode: "edit", goal, update });

  return (
    <CheckInForm form={form} goal={goal} readonly={isViewMode}>
      <EditBar save={form.actions.submit} cancel={form.actions.cancel} />
    </CheckInForm>
  );
}
