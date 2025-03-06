import React from "react";

import * as People from "@/models/people";
import * as Pages from "@/components/Pages";

import Forms from "@/components/Forms";
import { assertPresent } from "@/utils/assertions";
import { Spacer } from "@/components/Spacer";
import { EditBar } from "@/components/Pages/EditBar";
import { useForm } from "@/features/goals/GoalCheckIn";
import { useLoadedData } from "./loader";

export function Form() {
  const { update, goal } = useLoadedData();
  const isViewMode = Pages.useIsViewMode();

  const form = useForm({ mode: "edit", goal, update });
  const mentionSearchScope = { type: "goal", id: goal.id! } as const;

  assertPresent(goal.reviewer, "reviewer must be present in goal");

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <div className="flex items-start gap-8 mt-6">
          <Forms.SelectGoalStatus
            readonly={isViewMode}
            label="Status"
            field="status"
            reviewerFirstName={People.firstName(goal.reviewer)}
          />
          <Forms.TimeframeField readonly={isViewMode} label="Timeframe" field="timeframe" />
        </div>
      </Forms.FieldGroup>

      <Spacer size={4} />

      <Forms.FieldGroup>
        <Forms.GoalTargetsField
          readonly={isViewMode}
          field="targets"
          label={isViewMode ? "Targets" : "Update targets"}
        />
      </Forms.FieldGroup>

      <Spacer size={4} />

      <Forms.FieldGroup>
        <Forms.RichTextArea
          label={isViewMode ? "Key wins, obstacles and needs" : "Describe key wins, obstacles and needs"}
          field="description"
          placeholder="Write here..."
          mentionSearchScope={mentionSearchScope}
          readonly={isViewMode}
          required
        />
      </Forms.FieldGroup>

      <EditBar save={form.actions.submit} cancel={form.actions.cancel} />
    </Forms.Form>
  );
}
