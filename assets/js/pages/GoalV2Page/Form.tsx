import React from "react";

import * as Goals from "@/models/goals";

import Forms from "@/components/Forms";
import { useIsViewMode, useSetPageMode } from "@/components/Pages";
import { EditBar } from "@/components/Pages/EditBar";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";

export function Form() {
  const { goal } = useLoadedData();
  const [edit] = Goals.useEditGoal();

  assertPresent(goal.targets, "targets must be present in goal");

  const isViewMode = useIsViewMode();
  const setPageMode = useSetPageMode();

  const form = Forms.useForm({
    fields: {
      name: goal.name!,
      description: JSON.parse(goal.description!),
      targets: goal.targets,
    },
    cancel: () => setPageMode("view"),
    submit: async () => {
      await edit({
        goalId: goal.id,
        name: form.values.name,
        description: JSON.stringify(form.values.description),
        updatedTargets: findUpdatedTargets(goal.targets!, form.values.targets),
      });

      setPageMode("view");
    },
  });

  const mentionSearchScope = { type: "goal", id: goal.id! } as const;

  return (
    <Forms.Form form={form} preventSubmitOnEnter>
      <div className="flex gap-12">
        <div className="flex-1">
          <Forms.FieldGroup>
            <Forms.TitleInput field="name" readonly={isViewMode} />
            <Forms.RichTextArea
              field="description"
              placeholder="Write here..."
              mentionSearchScope={mentionSearchScope}
              readonly={isViewMode}
              height="3rem"
              hideBorder
              hideToolbar
            />

            <div className="my-2 border-t border-stroke-base" />

            <Forms.FieldGroup>
              <Forms.GoalTargetsField readonly={isViewMode} field="targets" label="Targets" />
            </Forms.FieldGroup>
          </Forms.FieldGroup>
        </div>

        <div className="w-[260px] sticky top-0 self-start"></div>
      </div>

      <EditBar save={form.actions.submit} cancel={form.actions.cancel} />
    </Forms.Form>
  );
}

function findUpdatedTargets(targets: Goals.Target[], updatedTargets: Goals.Target[]) {
  const originalTargets: Map<string, Goals.Target> = new Map();

  targets.forEach((target) => {
    originalTargets.set(target.id!, target);
  });

  const changedTargets = updatedTargets.filter((target) => {
    const originalTarget = originalTargets.get(target.id!);
    return target.value !== originalTarget?.value;
  });

  return changedTargets;
}
