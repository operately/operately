import React from "react";

import Forms from "@/components/Forms";
import { DimmedLink, SubscribersSelector } from "turboui";
import * as Goals from "@/models/goals";

import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { assertPresent } from "@/utils/assertions";

import { useForm } from "./useForm";
import { usePaths } from "@/routes/paths";

export function Form({ goal }: { goal: Goals.Goal }) {
  const paths = usePaths();
  assertPresent(goal.potentialSubscribers, "potentialSubscribers must be present in goal");
  assertPresent(goal.id, "goal id must be present in goal");

  const opts = goal.space ? { spaceName: goal.space.name } : { goalName: goal.name };
  const subscriptionsState = useSubscriptionsAdapter(goal.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
    ...opts
  });
  const form = useForm({ goal, subscriptionsState });
  const mentionSearchScope = { type: "goal", id: goal.id } as const;

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <div>
          <Forms.TitleInput
            field="title"
            placeholder="Title..."
            autoFocus
            testId="discussion-title"
            errorMessage="Please add a title"
          />
          <div className="mt-2 border-y border-stroke-base text-content-base font-medium">
            <Forms.RichTextArea
              field="message"
              mentionSearchScope={mentionSearchScope}
              placeholder="Start a new discussion..."
              hideBorder
              height="min-h-[350px]"
              fontSize="text-lg"
              horizontalPadding="px-0"
              verticalPadding="py-2"
            />
          </div>
        </div>
      </Forms.FieldGroup>

      <div className="my-10">
        <SubscribersSelector {...subscriptionsState} />
      </div>

      <Forms.FormError message="Fill out all the required fields" className="mt-4" />

      <div className="flex items-center gap-4 mt-4">
        <Forms.Submit saveText="Post Discussion" buttonSize="base" testId="post-discussion" containerClassName="mt-0" />
        <DimmedLink to={paths.goalPath(goal.id, { tab: "discussions" })}>Cancel</DimmedLink>
      </div>
    </Forms.Form>
  );
}
