import * as React from "react";
import * as People from "@/models/people";
import * as Goals from "@/models/goals";

import Forms from "@/components/Forms";
import { Spacer } from "@/components/Spacer";

interface Props {
  form: any;
  readonly: boolean;
  goal: Goals.Goal;
  children?: React.ReactNode;
}

export function Form({ form, readonly, goal, children }: Props) {
  const mentionSearchScope = { type: "goal", id: goal.id! } as const;

  return (
    <Forms.Form form={form} preventSubmitOnEnter>
      <StatusAndTimeframe goal={goal} readonly={readonly} />

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

function StatusAndTimeframe({ goal, readonly }: { goal: Goals.Goal; readonly: boolean }) {
  if (readonly) return null;

  return (
    <Forms.FieldGroup>
      <div className="flex items-start gap-8 mt-6">
        <StatusSelector goal={goal} />
        <Forms.TimeframeField label="Timeframe" field="timeframe" />
      </div>
    </Forms.FieldGroup>
  );
}

function StatusSelector({ goal }: { goal: Goals.Goal }) {
  const noReviewer = !goal.reviewer;
  const reviewerName = goal.reviewer ? People.firstName(goal.reviewer) : "";

  return (
    <Forms.SelectGoalStatus label="Status" field="status" reviewerFirstName={reviewerName} noReviewer={noReviewer} />
  );
}
