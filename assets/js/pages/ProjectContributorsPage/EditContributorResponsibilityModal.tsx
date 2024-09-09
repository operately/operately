import React from "react";
import Forms from "@/components/Forms";

import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as ProjectContributors from "@/models/projectContributors";
import * as People from "@/models/people";

import { PageState } from "./usePageState";
import Modal from "@/components/Modal";

interface Props {
  state: PageState;
  contributor: ProjectContributors.ProjectContributor;
}

export function EditContributorResponsibilityModal({ state, contributor }: Props) {
  const refresh = Pages.useRefresh();
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

      state.deactivateEditResponsibility();
      refresh();
    },
    cancel: async () => {
      state.deactivateEditResponsibility();
    },
  });

  const close = () => form.actions.cancel(form);

  return (
    <Modal
      title={`Edit ${contributor.person!.fullName}'s Responsibility`}
      hideModal={close}
      isOpen={state.editResponsibilityActiveFor === contributor.id}
      minHeight="0px"
    >
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.TextInput
            field={"responsibility"}
            placeholder="e.g. Project Manager"
            label={`What's ${People.firstName(contributor.person!)} responsible for on this project?`}
          />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Save" />
      </Forms.Form>
    </Modal>
  );
}
