import React from "react";

import { Goal, Target } from "@/models/goals";
import { Update } from "@/models/goalCheckIns";

import Forms from "@/components/Forms";
import { useSubscriptions } from "@/features/Subscriptions";
import { Spacer } from "@/components/Spacer";
import { createTestId } from "@/utils/testid";
import { useForm } from "./useForm";
import { assertPresent } from "@/utils/assertions";
import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import classNames from "classnames";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import AvatarList from "@/components/AvatarList";

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
  const { goal, mode } = props;

  assertPresent(goal.reviewer, "reviewer must be present in goal");

  const subscriptionsState = useSubscriptions(mode === "create" ? goal.potentialSubscribers! : [], {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
  });

  const form = useForm(props, subscriptionsState);

  return (
    <Forms.Form form={form}>
      <Header />

      <Forms.FieldGroup>
        <div className="flex items-start gap-8 mt-6">
          <div>
            <div className="font-bold text-sm mb-2">Current Status</div>

            <div className="w-48">
              <div className="border border-stroke-base shadow-sm bg-surface-dimmed text-sm rounded-lg px-2 py-1.5 flex items-center gap-2 relative overflow-hidden group cursor-pointer">
                <div className="border-2 border-surface-outline border-dashed w-4 h-4 rounded-full"></div>
                <div className="font-medium">Select Status</div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm mb-2 font-bold">Is the deadline still correct?</div>

            <div className="w-64">
              <Chronograph start="Jan 1" end="Dec 31" />
            </div>
          </div>
        </div>

        <Description goal={goal} />

        <Targets />
      </Forms.FieldGroup>

      <Spacer size={4} />

      <div className="">
        <div className="font-bold text-sm mb-1">Who to notify?</div>

        <div className="flex items-center gap-2">
          <AvatarList
            people={subscriptionsState.subscribers.map((s) => s.person!)}
            size={26}
            stacked
            stackSpacing={"-space-x-1"}
          />
          <SecondaryButton size="xs">Add/Remove</SecondaryButton>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <PrimaryButton size="sm">Sumbit</PrimaryButton>
          <SecondaryButton size="sm">Cancel</SecondaryButton>
        </div>
      </div>
    </Forms.Form>
  );
}

function Header() {
  return <div className="text-2xl font-bold">Check-in Feb 24th, 2024</div>;
}

function Description({ goal }: { goal: Goal }) {
  const mentionSearchScope = { type: "goal", id: goal.id! } as const;

  return (
    <div className="mt-4">
      <div className="text-sm mb-2 font-bold">What's new since your last update?</div>

      <Forms.RichTextArea
        field="description"
        mentionSearchScope={mentionSearchScope}
        fontSize="text-base"
        placeholder="Describe your progress, risks, and blockers..."
      />
    </div>
  );
}

function Chronograph({ start, end }: { start: string; end: string }) {
  return (
    <div className="border border-stroke-base shadow-sm bg-surface-dimmed text-xs rounded-lg px-2 py-2 flex items-center justify-between gap-1 relative overflow-hidden group cursor-pointer">
      <div className="absolute top-0 left-0 bottom-0 bg-indigo-500" style={{ width: "20%" }} />

      <span className="text-xs z-1 relative text-white-1 font-bold">{start}</span>
      <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
      <span className="text-xs font-medium z-1 relative">{end}</span>
    </div>
  );
}

function Targets() {
  return (
    <div className="mt-4">
      <div className="text-sm mb-1 font-bold">Update targets</div>

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
