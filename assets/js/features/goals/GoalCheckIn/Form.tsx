import React from "react";

import * as People from "@/models/people";
import Forms from "@/components/Forms";
import { Spacer } from "@/components/Spacer";
import { Goal } from "@/models/goals";
import { assertPresent } from "@/utils/assertions";
import { ProgressBar } from "@/components/charts";
import { SecondaryButton } from "@/components/Buttons";

interface Props {
  form: any;
  readonly: boolean;
  goal: Goal;
  children: React.ReactNode;
}

export function Form({ form, readonly, goal, children }: Props) {
  const mentionSearchScope = { type: "goal", id: goal.id! } as const;

  assertPresent(goal.reviewer, "reviewer must be present in goal");

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <div className="flex items-start gap-8 mt-6">
          <Forms.SelectGoalStatus
            readonly={readonly}
            label="Status"
            field="status"
            reviewerFirstName={People.firstName(goal.reviewer)}
          />
          <Forms.TimeframeField readonly={readonly} label="Timeframe" field="timeframe" />
        </div>
      </Forms.FieldGroup>

      <Spacer size={4} />

      <div className="font-bold mb-2">Update Targets</div>
      <Targets />

      <Spacer size={4} />

      <Forms.FieldGroup>
        <Forms.RichTextArea
          label={readonly ? "Key wins, obstacles and needs" : "Describe key wins, obstacles and needs"}
          field="description"
          placeholder="Write here..."
          mentionSearchScope={mentionSearchScope}
          readonly={readonly}
          required
        />
      </Forms.FieldGroup>

      {children}
    </Forms.Form>
  );
}

function Targets() {
  return (
    <div className="space-y-4">
      {/* First Target */}
      <div className="flex border border-surface-outline rounded-lg overflow-hidden">
        <div className="bg-stone-50 w-32 flex flex-col items-center justify-center py-2 border-r border-surface-outline relative">
          <div
            className="top-0 left-0 bottom-0 width-10 bg-green-200 absolute"
            style={{ height: "100px", width: "30px" }}
          />

          <div className="relative">
            <div className="text-xl font-bold text-gray-800 text-center">$ 10M</div>
            <div className="text-xs text-gray-500">Target: $ 20M</div>
          </div>
        </div>

        <div className="flex-1 p-4 flex items-center gap-4 justify-between">
          <div className="h-full flex flex-col justify-center">
            <div className="font-medium">Achieve month-over-month growth in new user signups</div>
          </div>

          <SecondaryButton size="xs" onClick={() => {}}>
            Edit
          </SecondaryButton>
        </div>
      </div>

      {/* First Target */}
      <div className="flex border border-surface-outline rounded-lg overflow-hidden">
        <div className="bg-stone-50 w-32 flex flex-col items-center justify-center py-2 border-r border-surface-outline relative">
          <div
            className="top-0 left-0 bottom-0 width-10 bg-green-200 absolute"
            style={{ height: "100px", width: "100px" }}
          />

          <div className="relative">
            <div className="text-sm font-bold text-gray-800 text-center">DONE</div>
          </div>
        </div>

        <div className="flex-1 p-4 flex items-center gap-4 justify-between">
          <div className="h-full flex flex-col justify-center">
            <div className="font-medium">Ensure 90% of new users are retained after 30 days</div>
          </div>

          <SecondaryButton size="xs" onClick={() => {}}>
            Edit
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
