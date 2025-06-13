import React from "react";

import Forms from "@/components/Forms";
import { emptyContent } from "@/components/RichContent";
import * as Goals from "@/models/goals";

import { Options, SubscribersSelector, SubscriptionsState, useSubscriptions } from "@/features/Subscriptions";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

export function Form() {
  const { goal } = useLoadedData();

  const [close] = Goals.useCloseGoal();
  const navigateToGoal = useNavigateTo(DeprecatedPaths.goalPath(goal.id!));

  assertPresent(goal.potentialSubscribers, "potentialSubscribers must be present in goal");

  const subscriptionsState = useSubscriptions(goal.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
  });

  const form = Forms.useForm({
    fields: {
      success: "yes",
      retrospective: emptyContent(),
    },
    submit: async () => {
      await close({
        goalId: goal.id,
        success: form.values.success,
        retrospective: JSON.stringify(form.values.retrospective),
        sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });
      navigateToGoal();
    },
    cancel: navigateToGoal,
  });

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <AccomplishedOrDropped />
        <RetrospectiveNotes />
      </Forms.FieldGroup>

      <Subscribers goal={goal} subscriptionsState={subscriptionsState} />

      <Forms.Submit saveText="Close Goal" />
    </Forms.Form>
  );
}

function AccomplishedOrDropped() {
  return (
    <Forms.RadioButtons
      field="success"
      label="Was this goal accomplished?"
      options={[
        { value: "yes", label: "Accomplished" },
        { value: "no", label: "Not accomplished" },
      ]}
    />
  );
}

function RetrospectiveNotes() {
  const { goal } = useLoadedData();

  return (
    <Forms.RichTextArea
      field="retrospective"
      label="Retrospective notes"
      mentionSearchScope={{ type: "goal", id: goal.id! }}
      placeholder="What went well? What didn't? What did you learn?"
      required
    />
  );
}

function Subscribers({ goal, subscriptionsState }: { goal: Goals.Goal; subscriptionsState: SubscriptionsState }) {
  assertPresent(goal.space, "space must be present in goal");

  return (
    <div className="my-10">
      <SubscribersSelector state={subscriptionsState} spaceName={goal.space.name} />
    </div>
  );
}
