import React from "react";

import * as People from "@/models/people";
import Forms from "@/components/Forms";
import { Spacer } from "@/components/Spacer";
import { Goal } from "@/models/goals";
import { assertPresent } from "@/utils/assertions";

interface Props {
  form: any;
  readonly: boolean;
  goal: Goal;
  children: React.ReactNode;
}

export function Form({ form, readonly, goal, children }: Props) {
  const mentionSearchScope = { type: "goal", id: goal.id! } as const;

  assertPresent(goal.reviewer, "reviewer must be present in goal");

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <div className="flex items-start gap-8 mt-6">
          <Forms.SelectGoalStatus
            readonly={readonly}
            label="Status"
            field="status"
            reviewerFirstName={People.firstName(goal.reviewer)}
          />
          <Forms.TimeframeField readonly={readonly} label="Timeframe" field="timeframe" />
        </div>
      </Forms.FieldGroup>

      <Spacer size={4} />

      <Forms.FieldGroup>
        <Forms.GoalTargetsField readonly={readonly} field="targets" label={readonly ? "Targets" : "Update targets"} />
      </Forms.FieldGroup>

      <Spacer size={4} />

      <Forms.FieldGroup>
        <Forms.RichTextArea
          label={readonly ? "Key wins, obstacles and needs" : "Describe key wins, obstacles and needs"}
          field="description"
          placeholder="Write here..."
          mentionSearchScope={mentionSearchScope}
          readonly={readonly}
          required
        />
      </Forms.FieldGroup>

      {children}
    </Forms.Form>
  );
}
