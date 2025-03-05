import React from "react";
import * as People from "@/models/people";
import { useNavigate } from "react-router-dom";

import { Goal } from "@/models/goals";
import { usePostGoalProgressUpdate } from "@/models/goalCheckIns";

import Forms from "@/components/Forms";

import { Options, SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { emptyContent } from "@/components/RichContent";
import { Spacer } from "@/components/Spacer";
import { assertPresent } from "@/utils/assertions";
import { Paths } from "@/routes/paths";

export function Form({ goal }: { goal: Goal }) {
  const [post] = usePostGoalProgressUpdate();
  const navigate = useNavigate();

  assertPresent(goal.space, "space must be present in goal");
  assertPresent(goal.targets, "targets must be present in goal");
  assertPresent(goal.reviewer, "reviewer must be present in goal");
  assertPresent(goal.timeframe, "timeframe must be present in goal");
  assertPresent(goal.potentialSubscribers, "potentialSubscribers must be present in goal");

  const subscriptionsState = useSubscriptions(goal.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
  });

  const form = Forms.useForm({
    fields: {
      status: null,
      timeframe: { startDate: new Date(goal.timeframe.startDate!), endDate: new Date(goal.timeframe.endDate!) },
      targets: goal.targets,
      description: emptyContent(),
    },
    cancel: () => navigate(Paths.goalPath(goal.id!)),
    submit: async () => {
      const res = await post({
        goalId: goal.id,
        status: form.values.status,
        content: JSON.stringify(form.values.description),
        newTargetValues: JSON.stringify(form.values.targets.map((t) => ({ id: t.id, value: t.value }))),
        sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });

      navigate(Paths.goalProgressUpdatePath(res.update!.id));
    },
  });

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
