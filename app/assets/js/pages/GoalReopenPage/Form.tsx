import React from "react";

import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";

import { Editor, PrimaryButton, SubscribersSelector, DimmedLink } from "turboui";
import { assertPresent } from "@/utils/assertions";
import { SubscriptionsState, useSubscriptionsAdapter } from "@/features/Subscriptions";

import { FormState, useForm } from "./useForm";

export function Form() {
  const { goal } = Pages.useLoadedData<{ goal: Goals.Goal }>();

  assertPresent(goal.potentialSubscribers, "potentialSubscribers must be present in goal");
  assertPresent(goal.space, "space must be present in goal");

  const subscriptionsState = useSubscriptionsAdapter(goal.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
    spaceName: goal.space.name,
  });
  const form = useForm(goal, subscriptionsState);

  return (
    <>
      <Message form={form} />

      <Subscribers subscriptionsState={subscriptionsState} />

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

function Subscribers({ subscriptionsState }: { subscriptionsState: SubscriptionsState }) {
  return (
    <div className="my-10">
      <SubscribersSelector {...subscriptionsState} />
    </div>
  );
}
