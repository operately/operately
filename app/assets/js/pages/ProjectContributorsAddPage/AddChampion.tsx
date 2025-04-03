import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";

import { PermissionLevels } from "@/features/Permissions";
import { ProjectContribsSubpageNavigation } from "@/components/ProjectPageNavigation";
import { useAddProjectContributor } from "@/api";

import Forms from "@/components/Forms";
import { Paths } from "@/routes/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { LoaderResult } from "./loader";

export function AddChampion() {
  const { project } = Pages.useLoadedData() as LoaderResult;

  const form = useForm();
  const search = Projects.useContributorSearchFn(project);

  return (
    <Paper.Root size="small">
      <ProjectContribsSubpageNavigation project={project} />

      <Paper.Body>
        <div className="text-2xl font-extrabold mb-4">Add Champion</div>

        <Forms.Form form={form}>
          <Forms.FieldGroup>
            <Forms.SelectPerson field={"person"} label="Champion" searchFn={search} />
          </Forms.FieldGroup>

          <Forms.Submit saveText="Add Champion" />
        </Forms.Form>
      </Paper.Body>
    </Paper.Root>
  );
}

function useForm() {
  const { project } = Pages.useLoadedData() as LoaderResult;
  const [add] = useAddProjectContributor();
  const goBack = useGoBack();

  const form = Forms.useForm({
    fields: {
      person: "",
    },
    submit: async () => {
      await add({
        projectId: project.id,
        personId: form.values.person,
        responsibility: "",
        permissions: PermissionLevels.FULL_ACCESS,
        role: "champion",
      });

      goBack();
    },
    cancel: goBack,
  });

  return form;
}

function useGoBack() {
  const { project } = Pages.useLoadedData() as LoaderResult;
  return useNavigateTo(Paths.projectContributorsPath(project.id!));
}
