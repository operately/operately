import React from "react";

import * as People from "@/models/people";
import { Goal } from "@/models/goals";

import Forms from "@/components/Forms";
import { SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { Spacer } from "@/components/Spacer";
import { assertPresent } from "@/utils/assertions";
import { useForm } from "@/features/goals/GoalCheckIn";

export function Form({ goal }: { goal: Goal }) {
  assertPresent(goal.space, "space must be present in goal");
  assertPresent(goal.reviewer, "reviewer must be present in goal");
  assertPresent(goal.potentialSubscribers, "potentialSubscribers must be present in goal");

  const subscriptionsState = useSubscriptions(goal.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
  });

  const form = useForm({ mode: "create", goal, subscriptionsState });
  const mentionSearchScope = { type: "goal", id: goal.id! } as const;

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <div className="flex items-start gap-8 mt-6">
          <Forms.SelectGoalStatus
            required
            label="Status"
            field="status"
            reviewerFirstName={People.firstName(goal.reviewer)}
          />
          <Forms.TimeframeField label="Timeframe" field="timeframe" />
        </div>
      </Forms.FieldGroup>

      <Spacer size={4} />

      <Forms.FieldGroup>
        <Forms.GoalTargetsField field="targets" label="Update targets" />
      </Forms.FieldGroup>

      <Spacer size={4} />

      <Forms.FieldGroup>
        <Forms.RichTextArea
          label="Describe key wins, obstacles and needs"
          field="description"
          placeholder="Write here..."
          mentionSearchScope={mentionSearchScope}
          required
        />
      </Forms.FieldGroup>

      <Spacer size={4} />

      <SubscribersSelector state={subscriptionsState} spaceName={goal.space.name!} />

      <Forms.Submit saveText="Check In" />
    </Forms.Form>
  );
}
