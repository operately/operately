import React from "react";

import { Goal, Target } from "@/models/goals";

import Forms from "@/components/Forms";
import { SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { Spacer } from "@/components/Spacer";
import { GoalProgressUpdate } from "@/api";
import { useForm } from "./useForm";

export interface CreateProps {
  goal: Goal;
  mode: "create";
}
export interface EditProps {
  goal: Goal;
  update: GoalProgressUpdate;
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

function TargetInputs() {
  const [targets] = Forms.useFieldValue<Target[]>("targets");

  return (
    <div>
      <div className="font-bold mb-2">Success Conditions</div>

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

              <Forms.TextInput field={`targets[${index}].value`} />
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
      <div className="font-bold mb-2">Describe your progress and any learnings</div>

      <Forms.RichTextArea
        field="description"
        mentionSearchScope={mentionSearchScope}
        placeholder="Write your update here..."
      />
    </div>
  );
}
