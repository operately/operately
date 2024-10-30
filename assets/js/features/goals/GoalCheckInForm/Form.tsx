import React from "react";

import { Goal, Target } from "@/models/goals";
import { Update } from "@/models/goalCheckIns";

import Forms from "@/components/Forms";
import { SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { Spacer } from "@/components/Spacer";
import { createTestId } from "@/utils/testid";
import { useForm } from "./useForm";

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

  const subscriptionsState = useSubscriptions(mode === "create" ? goal.potentialSubscribers! : [], {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
  });

  const form = useForm(props, subscriptionsState);

  return (
    <Forms.Form form={form}>
      <Header />

      <Forms.FieldGroup>
        <Status />
        <TargetInputs />
        <Description goal={goal} />
      </Forms.FieldGroup>

      <Spacer size={4} />

      {mode === "create" && <SubscribersSelector state={subscriptionsState} spaceName={goal.space?.name!} />}

      <Forms.Submit saveText={mode === "create" ? "Submit Update" : "Save"} buttonSize="base" />
    </Forms.Form>
  );
}

function Header() {
  return <div className="text-3xl font-bold mb-8">Update Progress</div>;
}

function Status() {
  return (
    <div className="mt-8 mb-4">
      <Forms.SelectStatus
        label="1. How's the goal going?"
        field="status"
        options={["on_track", "caution", "issue", "pending"]}
      />
    </div>
  );
}

function TargetInputs() {
  const [targets] = Forms.useFieldValue<Target[]>("targets");

  return (
    <div>
      <div className="font-bold mb-1">2. Success Conditions</div>

      <div className="flex flex-col gap-4">
        {targets.map((target, index) => {
          return (
            <div
              className="flex items-center justify-between bg-surface-dimmed border border-stroke-base p-3 rounded"
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
