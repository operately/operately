import React from "react";
import Forms from "@/components/Forms";
import { IconX } from "@tabler/icons-react";

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
  });

  if (!state.addContribVisible) return null;

  const close = () => {
    form.actions.reset();
    state.hideAddContribForm();
  };

  return (
    <div className="shadow-lg rounded-lg p-8 border mb-12 -mt-4 border-callout-warning-icon bg-callout-warning">
      <Title title="Add Contributor" closeForm={close} />

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
    </div>
  );
}

function Title({ title, closeForm }: { title: string; closeForm: () => void }) {
  return (
    <div className="flex items-center justify-between mb-8 border-b border-stroke-base pb-2">
      <h2 className="font-bold text-lg">{title}</h2>
      <IconX size={24} className="cursor-pointer text-content-dimmed hover:text-content-accent" onClick={closeForm} />
    </div>
  );
}
