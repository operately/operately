import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";

import { PERMISSIONS_LIST, PermissionLevels } from "@/features/Permissions";
import { ProjectContribsSubpageNavigation } from "@/components/ProjectPageNavigation";
import { useAddProjectContributor } from "@/api";

import Forms from "@/components/Forms";
import { Paths } from "@/routes/paths";
import { match } from "ts-pattern";
import { useNavigateTo } from "@/routes/useNavigateTo";

type ContributorTypeParam = "contributor" | "reviewer" | "champion";

export interface UrlParams {
  type: ContributorTypeParam;
}

interface LoaderResult {
  project: Projects.Project;
  contribType: ContributorTypeParam;
}

export async function loader({ request, params }): Promise<LoaderResult> {
  const project = await Projects.getProject({
    id: params.projectID,
    includePermissions: true,
  }).then((data) => data.project!);

  const type = Pages.getSearchParam(request, "type") as ContributorTypeParam;

  return { project: project, contribType: type };
}

export function Page() {
  const { project, contribType } = Pages.useLoadedData() as LoaderResult;

  return (
    <Paper.Root size={pageSize(contribType)}>
      <ProjectContribsSubpageNavigation project={project} />

      <Paper.Body>
        <PageTitle />
        <Form />
      </Paper.Body>
    </Paper.Root>
  );
}

function PageTitle() {
  const { contribType } = Pages.useLoadedData() as LoaderResult;

  return (
    <div className="pb-6">
      <div className="text-2xl font-extrabold">Add {contribType}</div>
      <ReviewerSubtitle />
    </div>
  );
}

function ReviewerSubtitle() {
  const { contribType } = Pages.useLoadedData() as LoaderResult;

  if (contribType !== "reviewer") return null;

  return (
    <div className="text-medium">
      Reviewers are responsible for acknowledging each check-in and have the authority to initiate corrective action if
      needed. This is typically the person to whom the champion reports to.
    </div>
  );
}

function Form() {
  const { project, contribType } = Pages.useLoadedData() as LoaderResult;
  const gotoContribPage = useNavigateTo(Paths.projectContributorsPath(project.id!));
  const [add] = useAddProjectContributor();

  const form = Forms.useForm({
    fields: {
      person: "",
      responsibility: "",
      permissions: useSelectAccessLevelField(),
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
      {match(contribType)
        .with("contributor", () => <AddContributor />)
        .with("reviewer", () => <AddReviewer />)
        .with("champion", () => <AddChampion />)
        .exhaustive()}
    </Forms.Form>
  );
}

function AddChampion() {
  return (
    <>
      <Forms.FieldGroup>
        <Forms.SelectPerson field={"person"} label="Champion" />
      </Forms.FieldGroup>

      <Forms.Submit saveText="Add Champion" />
    </>
  );
}

function AddReviewer() {
  return (
    <>
      <Forms.FieldGroup>
        <Forms.SelectPerson field={"person"} label="Reviewer" />
      </Forms.FieldGroup>

      <Forms.Submit saveText="Add Reviewer" />
    </>
  );
}

function AddContributor() {
  const { project, contribType } = Pages.useLoadedData() as LoaderResult;
  const personSearchFn = Projects.useContributorSearchFn(project!);

  return (
    <>
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
    </>
  );
}

function pageSize(contribType: ContributorTypeParam): Paper.Size {
  return match(contribType)
    .with("contributor", () => "medium" as Paper.Size)
    .with("reviewer", () => "small" as Paper.Size)
    .with("champion", () => "small" as Paper.Size)
    .exhaustive();
}

function useSelectAccessLevelField() {
  const { contribType } = Pages.useLoadedData() as LoaderResult;

  return match(contribType)
    .with("contributor", () => PermissionLevels.EDIT_ACCESS)
    .with("reviewer", () => PermissionLevels.FULL_ACCESS)
    .with("champion", () => PermissionLevels.FULL_ACCESS)
    .exhaustive();
}
