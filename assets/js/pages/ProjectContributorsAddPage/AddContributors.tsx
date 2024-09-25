import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";

import { PERMISSIONS_LIST, PermissionLevels } from "@/features/Permissions";
import { useAddProjectContributors } from "@/api";

import Forms from "@/components/Forms";
import { Paths } from "@/routes/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { LoaderResult } from "./loader";

export function AddContributors() {
  const { project, contribType } = Pages.useLoadedData() as LoaderResult;
  const gotoContribPage = useNavigateTo(Paths.projectContributorsPath(project.id!));
  const personSearchFn = Projects.useContributorSearchFn(project!);
  const [add] = useAddProjectContributors();

  const form = Forms.useForm({
    fields: {
      contributors: {
        personId: "",
        responsibility: "",
        permissions: PermissionLevels.EDIT_ACCESS,
        role: "contributor",
      },
    },
    submit: async () => {
      await add({
        projectId: project.id,
        contributors: form.values.contributors,
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
