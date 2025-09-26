import React from "react";

import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";

import { Editor, PrimaryButton } from "turboui";
import { DimmedLink } from "turboui";
import { assertPresent } from "@/utils/assertions";
import { SubscribersSelector, SubscriptionsState, useSubscriptions } from "@/features/Subscriptions";

import { FormState, useForm } from "./useForm";

export function Form() {
  const { goal } = Pages.useLoadedData<{ goal: Goals.Goal }>();

  assertPresent(goal.potentialSubscribers, "potentialSubscribers must be present in goal");

  const subscriptionsState = useSubscriptions(goal.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
  });
  const form = useForm(goal, subscriptionsState);

  return (
    <>
      <Message form={form} />

      <Subscribers goal={goal} subscriptionsState={subscriptionsState} />

      <div className="flex items-center gap-6 mt-8">
        <SubmitButton form={form} />
        <DimmedLink to={form.cancelPath}>Cancel</DimmedLink>
      </div>
    </>
  );
}

function Message({ form }: { form: FormState }) {
  return (
    <div className="mt-6">
      <div className="font-bold mb-2">Why are you reopening this goal?</div>

      <div className="border border-surface-outline rounded overflow-hidden">
        <Editor editor={form.messageEditor} hideBorder padding="px-2" />
      </div>
    </div>
  );
}

function SubmitButton({ form }: { form: FormState }) {
  return (
    <PrimaryButton onClick={form.submit} testId="confirm-reopen-goal">
      Reopen Goal
    </PrimaryButton>
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
