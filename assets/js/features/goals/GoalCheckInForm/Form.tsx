import React from "react";

import { Goal } from "@/models/goals";
import { Update } from "@/models/goalCheckIns";

import Forms from "@/components/Forms";
import { useSubscriptions } from "@/features/Subscriptions";
import { Spacer } from "@/components/Spacer";
import { useForm } from "./useForm";
import { assertPresent } from "@/utils/assertions";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import AvatarList from "@/components/AvatarList";

import { StatusPicker } from "./StatusPicker";
import { Timeframe } from "./Timeframe";
import { Targets } from "./Targets";

export interface CreateProps {
  goal: Goal;
  mode: "create";
}
export interface EditProps {
  goal: Goal;
  update: Update;
  mode: "edit";
}

export function Form(props: CreateProps | EditProps) {
  const { goal } = props;

  assertPresent(goal.reviewer, "reviewer must be present in goal");

  const subscriptionsState = useSubscriptions(goal.potentialSubscribers!, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
  });

  const form = useForm(props, subscriptionsState);

  return (
    <Forms.Form form={form}>
      <Header />

      <Forms.FieldGroup>
        <div className="flex items-start gap-8 mt-6">
          <StatusPicker />
          <Timeframe goal={goal} />
        </div>

        <Targets />
        <Description goal={goal} />
      </Forms.FieldGroup>

      <Spacer size={4} />

      <div className="">
        <WhoToNotify subscriptionsState={subscriptionsState} />
        <div className="flex items-center gap-2 mt-8">
          <PrimaryButton>Post Update</PrimaryButton>
          <SecondaryButton>Cancel</SecondaryButton>
        </div>
      </div>
    </Forms.Form>
  );
}

function Header() {
  return (
    <div>
      <div className="text-3xl font-bold">Goal Check-in</div>
      <div className="">Share the progress with the team</div>
    </div>
  );
}

function Description({ goal }: { goal: Goal }) {
  const mentionSearchScope = { type: "goal", id: goal.id! } as const;

  return (
    <div className="mt-4">
      <div className="mb-2 font-bold">Describe key wins, obstacles and needs</div>

      <Forms.RichTextArea
        field="description"
        mentionSearchScope={mentionSearchScope}
        fontSize="text-base"
        placeholder="Write here..."
      />
    </div>
  );
}

function WhoToNotify({ subscriptionsState }) {
  return (
    <div>
      <div className="font-bold mb-1">When I post this, notify:</div>

      <div className="flex items-center gap-2">
        <AvatarList
          people={subscriptionsState.subscribers.map((s: any) => s.person!)}
          size={30}
          stacked
          stackSpacing={"-space-x-1"}
        />
        <SecondaryButton size="xs">Add/Remove</SecondaryButton>
      </div>
    </div>
  );
}
