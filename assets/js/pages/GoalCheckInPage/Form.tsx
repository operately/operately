import React from "react";

import { useEditGoalProgressUpdate } from "@/models/goalCheckIns";
import * as People from "@/models/people";
import * as Pages from "@/components/Pages";

import Forms from "@/components/Forms";
import { assertPresent } from "@/utils/assertions";
import { Spacer } from "@/components/Spacer";

import { useLoadedData } from "./loader";

export function Form() {
  const { update, goal } = useLoadedData();
  const [edit] = useEditGoalProgressUpdate();

  const isViewMode = Pages.useIsViewMode();
  const setPageMode = Pages.useSetPageMode();

  assertPresent(update.goal?.timeframe, "goal.timeframe must be present in update");
  assertPresent(goal.reviewer, "reviewer must be present in goal");

  const form = Forms.useForm({
    fields: {
      status: update.status,
      timeframe: {
        startDate: new Date(update.goal.timeframe.startDate!),
        endDate: new Date(update.goal.timeframe.endDate!),
      },
      targets: update.goal.targets!,
      description: JSON.parse(update.message!),
    },
    cancel: () => setPageMode("view"),
    submit: async () => {
      await edit({
        id: update.id,
        status: form.values.status,
        content: JSON.stringify(form.values.description),
        newTargetValues: JSON.stringify(form.values.targets.map((t) => ({ id: t.id, value: t.value }))),
      });

      setPageMode("view");
    },
  });

  const mentionSearchScope = { type: "goal", id: update.goal.id! } as const;

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <div className="flex items-start gap-8 mt-6">
          <Forms.SelectGoalStatus
            readonly={isViewMode}
            label="Status"
            field="status"
            reviewerFirstName={People.firstName(goal.reviewer)}
          />
          <Forms.TimeframeField readonly={isViewMode} label="Timeframe" field="timeframe" />
        </div>
      </Forms.FieldGroup>

      <Spacer size={4} />

      <Forms.FieldGroup>
        <Forms.GoalTargetsField
          readonly={isViewMode}
          field="targets"
          label={isViewMode ? "Targets" : "Update targets"}
        />
      </Forms.FieldGroup>

      <Spacer size={4} />

      <Forms.FieldGroup>
        <Forms.RichTextArea
          label={isViewMode ? "Description" : "Describe key wins, obstacles and needs"}
          field="description"
          placeholder="Write here..."
          mentionSearchScope={mentionSearchScope}
          readonly={isViewMode}
          required
        />
      </Forms.FieldGroup>

      {!isViewMode && <Forms.Submit />}
    </Forms.Form>
  );
}
