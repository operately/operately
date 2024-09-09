import React from "react";
import Forms from "@/components/Forms";

import { PageState } from "./usePageState";
import { useAddProjectContributor } from "@/api";
import { useLoadedData, useRefresh } from "./loader";
import { InlineModal } from "./InlineModal";

export function AddReviewerModal({ state }: { state: PageState }) {
  const { project } = useLoadedData();
  const refresh = useRefresh();

  const [add] = useAddProjectContributor();

  const form = Forms.useForm({
    fields: {
      person: Forms.useSelectPersonField(),
    },
    submit: async (form) => {
      await add({
        projectId: project.id,
        personId: form.fields.person.value!.id!,
        // role: "reviewer",
      });

      refresh();
    },
  });

  const close = () => {
    form.actions.reset();
    state.hideAddContribForm();
  };

  return (
    <InlineModal title="Add Reviewer" onClose={close}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.SelectPerson field={"person"} label="Reviewer" />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Add as reviewer" />
      </Forms.Form>
    </InlineModal>
  );
}
