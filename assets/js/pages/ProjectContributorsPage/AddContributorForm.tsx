import React from "react";
import Forms from "@/components/Forms";

import { PERMISSIONS_LIST, PermissionLevels } from "@/features/Permissions";
import { PageState } from "./usePageState";
import { useAddProjectContributor } from "@/api";
import { useLoadedData, useRefresh } from "./loader";

export function AddContributorForm({ state }: { state: PageState }) {
  const { project } = useLoadedData();
  const refresh = useRefresh();

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

      refresh();
      state.hideAddContribForm();
    },
    cancel: async () => {
      state.hideAddContribForm();
    },
  });

  if (!state.addContribVisible) return null;

  return (
    <div className="bg-surface-dimmed border-y border-surface-outline -mx-12 px-12 mt-4 py-8">
      <Forms.Form form={form}>
        <Forms.FieldGroup layout="horizontal">
          <Forms.SelectPerson field={"person"} label="Contributor" />
          <Forms.TextInput field={"responsibility"} placeholder="e.g. Project Manager" label="Responsibility" />
          <Forms.SelectBox field={"permissions"} label="Access Level" />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Add Contributor" />
      </Forms.Form>
    </div>
  );
}
