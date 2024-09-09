import React from "react";
import Forms from "@/components/Forms";

import { PERMISSIONS_LIST, PermissionLevels } from "@/features/Permissions";
import { PageState } from "./usePageState";
import { useAddProjectContributor } from "@/api";
import { useLoadedData } from "./loader";

import * as Paper from "@/components/PaperContainer";
import { ProjectContribsSubpageNavigation } from "@/components/ProjectPageNavigation";

export function AddContribView({ state }: { state: PageState }) {
  const { project } = useLoadedData();

  return (
    <Paper.Root>
      <ProjectContribsSubpageNavigation project={project} />

      <Paper.Body>
        <div className="text-2xl font-extrabold pb-8">Add Contributor</div>

        <Form state={state} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Form({ state }: { state: PageState }) {
  const { project } = useLoadedData();
  const [add] = useAddProjectContributor();

  const form = Forms.useForm({
    fields: {
      person: Forms.useSelectPersonField(),
      responsibility: Forms.useTextField(""),
      permissions: Forms.useSelectNumberField(PermissionLevels.EDIT_ACCESS, PERMISSIONS_LIST),
    },
    submit: async (form) => {
      await add({
        projectId: project.id,
        personId: form.fields.person.value!.id!,
        responsibility: form.fields.responsibility.value!,
        permissions: form.fields.permissions.value,
      });

      state.goToListView();
    },
    cancel: async () => state.goToListView(),
  });

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.FieldGroup layout="grid" gridColumns={2}>
          <Forms.SelectPerson field={"person"} label="Contributor" />
          <Forms.SelectBox field={"permissions"} label="Access Level" />
        </Forms.FieldGroup>
        <Forms.TextInput field={"responsibility"} placeholder="e.g. Project Manager" label="Responsibility" />
      </Forms.FieldGroup>

      <Forms.Submit saveText="Add Contributor" secondarySubmitText="Save &amp; Add Another" />
    </Forms.Form>
  );
}
