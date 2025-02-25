import React from "react";

import { Goal, Target } from "@/models/goals";
import { Update } from "@/models/goalCheckIns";
import { Person } from "@/models/people";

import Forms from "@/components/Forms";
import { SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { Spacer } from "@/components/Spacer";
import { createTestId } from "@/utils/testid";
import { useForm } from "./useForm";
import { assertPresent } from "@/utils/assertions";
import { DimmedLink, DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import classNames from "classnames";
import { AddTarget } from "../GoalForm/Target";

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
        <div className="flex items-start gap-8">
          <div>
            <div className="font-bold text-sm mb-2">Status</div>

            <div className="w-48">
              <div className="border border-stroke-base shadow-sm bg-surface-dimmed text-sm rounded-lg px-2 py-1.5 flex items-center gap-2 relative overflow-hidden group cursor-pointer">
                <div className="border-2 border-surface-outline border-dashed w-4 h-4 rounded-full"></div>
                <div className="font-medium">Select Status</div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm mb-2 flex items-center gap-2">
              <div className="font-bold">Timeframe</div>
            </div>

            <div className="w-64">
              <Chronograph start="Jan 1" end="Dec 31" />
            </div>
          </div>
        </div>

        <Targets />
        <Description goal={goal} />
      </Forms.FieldGroup>

      <Spacer size={4} />

      {mode === "create" && <SubscribersSelector state={subscriptionsState} spaceName={goal.space?.name!} />}

      <Forms.Submit saveText={mode === "create" ? "Submit Update" : "Save"} buttonSize="base" />
    </Forms.Form>
  );
}

function Header() {
  return <div className="text-3xl font-bold mb-8">How's the goal progressing?</div>;
}

function TargetInputs() {
  const [targets] = Forms.useFieldValue<Target[]>("targets");

  return (
    <div>
      <div className="font-bold mb-1 text-sm mt-4">Targets</div>

      <div className="flex flex-col gap-4">
        {targets.map((target, index) => {
          return (
            <div
              className="grid grid-cols-[1fr,auto] items-center bg-surface-dimmed border border-stroke-base p-3 rounded"
              key={index}
            >
              <div className="flex flex-col">
                <div className="font-semibold text-content-accent">{target.name}</div>
                <div className="text-content-dimmed text-sm">
                  Target: {target.to} {target.unit}
                </div>
              </div>

              <Forms.TextInput field={`targets[${index}].value`} testId={createTestId("target", target.name!)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Description({ goal }: { goal: Goal }) {
  const mentionSearchScope = { type: "goal", id: goal.id! } as const;

  return (
    <div className="mt-4">
      <Forms.RichTextArea
        label="3. Describe your progress and any learnings"
        field="description"
        mentionSearchScope={mentionSearchScope}
        placeholder="Write your update here..."
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
    <div className="mt-6 pt-6 mb-4 border-t border-stroke-base">
      <div className="flex items-center gap-2 mb-4">
        <div className="uppercase text-xs font-bold tracking-wider">Targets</div>
      </div>
      <div className="">
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
