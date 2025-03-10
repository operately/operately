import React from "react";

import { useEditGoal } from "@/models/goals";

import Forms from "@/components/Forms";
import { useIsViewMode, useSetPageMode } from "@/components/Pages";
import { EditBar } from "@/components/Pages/EditBar";

import { useLoadedData } from "./loader";

export function Form() {
  const { goal } = useLoadedData();
  const [edit] = useEditGoal();

  const isViewMode = useIsViewMode();
  const setPageMode = useSetPageMode();

  const form = Forms.useForm({
    fields: {
      name: goal.name!,
      description: JSON.parse(goal.description!),
    },
    cancel: () => setPageMode("view"),
    submit: async () => {
      await edit({
        goalId: goal.id,
        name: form.values.name,
        description: JSON.stringify(form.values.description),
      });

      setPageMode("view");
    },
  });

  const mentionSearchScope = { type: "goal", id: goal.id! } as const;

  return (
    <Forms.Form form={form}>
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
          </Forms.FieldGroup>
        </div>

        <div className="w-[260px] sticky top-0 self-start"></div>
      </div>

      <EditBar save={form.actions.submit} cancel={form.actions.cancel} />
    </Forms.Form>
  );
}
