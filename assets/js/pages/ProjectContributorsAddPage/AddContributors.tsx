import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";

import { PERMISSIONS_LIST, PermissionLevels } from "@/features/Permissions";
import { useAddProjectContributor } from "@/api";

import Forms from "@/components/Forms";
import { Paths } from "@/routes/paths";
import { match } from "ts-pattern";
import { useNavigateTo } from "@/routes/useNavigateTo";

export function AddContributors() {
  return <Form />;
}

function Form() {
  const { project, contribType } = Pages.useLoadedData() as LoaderResult;
  const gotoContribPage = useNavigateTo(Paths.projectContributorsPath(project.id!));
  const personSearchFn = Projects.useContributorSearchFn(project!);
  const [add] = useAddProjectContributor();

  const form = Forms.useForm({
    fields: {
      person: "",
      responsibility: "",
      permissions: PermissionLevels.EDIT_ACCESS,
    },
    submit: async () => {
      await add({
        projectId: project.id,
        personId: form.values.person,
        responsibility: form.values.responsibility,
        permissions: form.values.permissions,
        role: contribType,
      });

      gotoContribPage();
    },
    cancel: async () => gotoContribPage(),
  });

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.FieldGroup layout="grid">
          <Forms.SelectPerson field={"person"} label="Contributor" searchFn={personSearchFn} />
          <Forms.SelectBox field={"permissions"} label="Access Level" options={PERMISSIONS_LIST} />
        </Forms.FieldGroup>

        <Forms.TextInput
          field={"responsibility"}
          placeholder="e.g. Project Manager"
          label="Responsibility"
          required={contribType == "contributor"}
        />
      </Forms.FieldGroup>

      <Forms.Submit saveText="Add Contributor" />
    </Forms.Form>
  );
}
