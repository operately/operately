import React from "react";

import { Goal } from "@/models/goals";

import Forms from "@/components/Forms";
import { SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { Spacer } from "@/components/Spacer";
import { assertPresent } from "@/utils/assertions";
import { useForm, Form as CheckInForm } from "@/features/goals/GoalCheckIn";

export function Form({ goal }: { goal: Goal }) {
  assertPresent(goal.space, "space must be present in goal");
  assertPresent(goal.potentialSubscribers, "potentialSubscribers must be present in goal");

  const subscriptionsState = useSubscriptions(goal.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
  });

  const form = useForm({ mode: "create", goal, subscriptionsState });

  return (
    <CheckInForm form={form} goal={goal} readonly={false}>
      <Spacer size={4} />
      <SubscribersSelector state={subscriptionsState} spaceName={goal.space.name!} />
      <Forms.Submit saveText="Submit" buttonSize="base" />
    </CheckInForm>
  );
}
