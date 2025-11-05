import React from "react";

import Forms from "@/components/Forms";
import * as Goals from "@/models/goals";

import { SubscriptionsState, useSubscriptionsAdapter } from "@/models/subscriptions";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
import { emptyContent, SubscribersSelector } from "turboui";

export function Form() {
  const paths = usePaths();
  const { goal } = useLoadedData();

  const [close] = Goals.useCloseGoal();
  const navigateToGoal = useNavigateTo(paths.goalPath(goal.id!));

  assertPresent(goal.potentialSubscribers, "potentialSubscribers must be present in goal");
  assertPresent(goal.space, "space must be present in goal");

  const subscriptionsState = useSubscriptionsAdapter(goal.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
    spaceName: goal.space.name,
  });

  const form = Forms.useForm({
    fields: {
      success: "yes",
      retrospective: emptyContent(),
    },
    submit: async () => {
      const successStatus = form.values.success === "yes" ? "achieved" : "missed";

      await close({
        goalId: goal.id,
        success: form.values.success,
        successStatus: successStatus,
        retrospective: JSON.stringify(form.values.retrospective),
        sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
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

      <Subscribers subscriptionsState={subscriptionsState} />

      <Forms.Submit saveText="Close Goal" />
    </Forms.Form>
  );
}

function AccomplishedOrDropped() {
  return (
    <Forms.RadioButtons
      field="success"
      label="Was this goal achieved?"
      options={[
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
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

function Subscribers({ subscriptionsState }: { subscriptionsState: SubscriptionsState }) {
  return (
    <div className="my-10">
      <SubscribersSelector {...subscriptionsState} />
    </div>
  );
}
