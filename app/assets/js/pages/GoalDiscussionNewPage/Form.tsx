import React from "react";

import { DimmedLink, PrimaryButton } from "turboui";

import * as TipTapEditor from "@/components/Editor";
import { FormTitleInput } from "@/components/FormTitleInput";
import * as Goals from "@/models/goals";

import { SubscribersSelector, SubscriptionsState, useSubscriptions } from "@/features/Subscriptions";
import { DeprecatedPaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

import { useForm } from "./useForm";

export function Form({ goal }: { goal: Goals.Goal }) {
  assertPresent(goal.potentialSubscribers, "potentialSubscribers must be present in goal");

  const subscriptionsState = useSubscriptions(goal.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
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
        <TipTapEditor.StandardEditorForm editor={form.fields.editor.editor} />
      </div>

      <Subscribers goal={goal} subscriptionsState={subscriptionsState} />

      <div className="flex items-center gap-4 mt-4">
        <PrimaryButton testId="post-discussion" onClick={form.submit} loading={form.submitting}>
          Post Discussion
        </PrimaryButton>

        <DimmedLink to={DeprecatedPaths.goalDiscussionsPath(goal.id!)}>Cancel</DimmedLink>
      </div>
    </>
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
