import React from "react";

import { DimmedLink, Editor, PrimaryButton, SubscribersSelector } from "turboui";

import { FormTitleInput } from "@/components/FormTitleInput";
import * as Goals from "@/models/goals";

import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { assertPresent } from "@/utils/assertions";

import { useForm } from "./useForm";
import { usePaths } from "@/routes/paths";

export function Form({ goal }: { goal: Goals.Goal }) {
  const paths = usePaths();
  assertPresent(goal.potentialSubscribers, "potentialSubscribers must be present in goal");
  assertPresent(goal.space, "space must be present in goal");

  const subscriptionsState = useSubscriptionsAdapter(goal.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
    spaceName: goal.space.name,
  });
  const form = useForm({ goal, subscriptionsState });

  return (
    <>
      <FormTitleInput
        value={form.fields.title}
        onChange={form.fields.setTitle}
        error={false}
        testId="discussion-title"
      />

      <div className="mt-2 border-y border-stroke-base text-content-base font-medium ">
        <Editor editor={form.fields.editor} hideBorder padding="p-0" />
      </div>

      <div className="my-10">
        <SubscribersSelector {...subscriptionsState} />
      </div>

      <div className="flex items-center gap-4 mt-4">
        <PrimaryButton testId="post-discussion" onClick={form.submit} loading={form.submitting}>
          Post Discussion
        </PrimaryButton>

        <DimmedLink to={paths.goalPath(goal.id!, { tab: "discussions" })}>Cancel</DimmedLink>
      </div>
    </>
  );
}
