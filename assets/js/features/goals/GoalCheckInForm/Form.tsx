import React from "react";

import { Goal, Target } from "@/models/goals";
import { Update } from "@/models/goalCheckIns";

import Forms from "@/components/Forms";
import { useSubscriptions } from "@/features/Subscriptions";
import { Spacer } from "@/components/Spacer";
import { useForm } from "./useForm";
import { assertPresent } from "@/utils/assertions";
import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import classNames from "classnames";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import AvatarList from "@/components/AvatarList";

import { StatusPicker } from "./StatusPicker";
import { Timeframe, TimeframeSelector } from "./Timeframe";

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
      <div className="mb-2 font-bold">What's new since your last update?</div>

      <Forms.RichTextArea
        field="description"
        mentionSearchScope={mentionSearchScope}
        fontSize="text-base"
        placeholder="Describe your progress, risks, and blockers..."
      />
    </div>
  );
}

function Targets() {
  return (
    <div className="mt-4">
      <div className="mb-1 font-bold">Update targets</div>

      <div className="grid grid-cols-1">
        <Target name="Figure out how to open a new office in Brazil" value={0} total={0} progress={0} index={1} />
        <Target name="Eliminate blockers for selling in China" value={4} total={20} progress={20} index={2} />
        <Target name="Achieve 1000+ active users in new countries" value={700} total={1000} progress={70} index={3} />
        <Target
          name="Increase revenue by 20% from international sales"
          value={"$ 1.2M"}
          total={"$ 1M"}
          progress={100}
          index={4}
        />
      </div>
    </div>
  );
}

function Target({ name, value, total, progress, index }) {
  return (
    <DivLink className="hover:bg-surface-highlight px-2 py-2 -mx-2" to={Paths.targetPath(index.toString())}>
      <div className="flex items-start justify-between">
        <div className="font-medium">{name}</div>
        <div className="tracking-wider text-sm font-medium">
          {value} / {total}
        </div>
      </div>

      <LargeProgress progress={progress} color="bg-accent-1" />
    </DivLink>
  );
}

function LargeProgress({ progress, color }) {
  const outer = classNames("h-1.5 bg-stroke-base mt-2");
  const inner = classNames("h-1.5", color);

  return (
    <div className={outer}>
      <div className={inner} style={{ width: progress + "%" }} />
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
