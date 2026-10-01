import { useTranslation } from "react-i18next";
import React from "react";

import { useLoadedData } from "./loader";

import { Editor, PrimaryButton, SubscribersSelector, DimmedLink } from "turboui";
import { SubscriptionsState, useSubscriptionsAdapter } from "@/models/subscriptions";

import { FormState, useForm } from "./useForm";
import { assertPresent } from "@/utils/assertions";

export function Form() {
  const { t } = useTranslation();
  const { goal } = useLoadedData();

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
        <DimmedLink to={form.cancelPath}>{t("Cancel")}</DimmedLink>
      </div>
    </>
  );
}

function Message({ form }: { form: FormState }) {
  const { t } = useTranslation();
  return (
    <div className="mt-6">
      <div className="font-bold mb-2">{t("Why are you reopening this goal?")}</div>

      <div className="border border-surface-outline rounded overflow-hidden">
        <Editor editor={form.messageEditor} hideBorder padding="px-2" />
      </div>
    </div>
  );
}

function SubmitButton({ form }: { form: FormState }) {
  const { t } = useTranslation();
  return (
    <PrimaryButton onClick={form.submit} testId="confirm-reopen-goal">
      {t("Reopen Goal")}
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
