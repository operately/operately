import React from "react";
import Forms from "@/components/Forms";

import { PageState } from "./usePageState";

import * as Projects from "@/models/projects";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import { ProjectContribsSubpageNavigation } from "@/components/ProjectPageNavigation";

export function EditContribView({ state }: { state: PageState }) {
  const { project } = Pages.useLoadedData();

  return (
    <Paper.Root>
      <ProjectContribsSubpageNavigation project={project} />

      <Paper.Body>
        <div className="text-2xl font-extrabold pb-8">Edit Contributor</div>

        <Form state={state} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Form({ state }: { state: PageState }) {
  const contributor = state.contributor!;
  const [update] = Projects.useUpdateProjectContributor();

  const form = Forms.useForm({
    fields: {
      responsibility: Forms.useTextField(contributor.responsibility),
    },
    submit: async (form) => {
      await update({
        contribId: contributor.id,
        responsibility: form.fields.responsibility.value!,
      });

      state.goToListView();
    },
    cancel: async () => {
      state.goToListView();
    },
  });

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.TextInput
          field={"responsibility"}
          placeholder="e.g. Project Manager"
          label={"Responsibility on this project"}
        />
      </Forms.FieldGroup>

      <Forms.Submit saveText="Save" />
    </Forms.Form>
  );
}
