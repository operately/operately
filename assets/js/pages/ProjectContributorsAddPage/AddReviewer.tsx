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

export function AddReviewer() {
  const { project } = Pages.useLoadedData() as LoaderResult;

  const form = useForm();
  const search = Projects.useContributorSearchFn(project);

  return (
    <Paper.Root size="small">
      <ProjectContribsSubpageNavigation project={project} />

      <Paper.Body>
        <div className="text-2xl font-extrabold">Add Reviewer</div>
        <div className="text-medium mb-6">
          Reviewers are responsible for acknowledging each check-in and have the authority to initiate corrective action
          if needed. This is typically the person to whom the champion reports to.
        </div>

        <Forms.Form form={form}>
          <Forms.FieldGroup>
            <Forms.SelectPerson field={"person"} label="Reviewer" searchFn={search} />
          </Forms.FieldGroup>

          <Forms.Submit saveText="Add Reviewer" />
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
        role: "reviewer",
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
