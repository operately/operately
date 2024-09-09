import React from "react";
import Forms from "@/components/Forms";

import { PERMISSIONS_LIST, PermissionLevels } from "@/features/Permissions";
import { PageState } from "./usePageState";
import { useAddProjectContributor } from "@/api";
import { useLoadedData, useRefresh } from "./loader";
import { InlineModal } from "./InlineModal";

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
    <div className="mb-8 -mt-4">
      <InlineModal title="Add Contributor" onClose={close}>
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
      </InlineModal>
    </div>
  );
}
