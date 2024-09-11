import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as ProjectContributors from "@/models/projectContributors";

import Forms from "@/components/Forms";
import { ProjectContribsSubpageNavigation } from "@/components/ProjectPageNavigation";
import { PermissionLevels, PERMISSIONS_LIST } from "@/features/Permissions";
import { match } from "ts-pattern";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { Paths } from "@/routes/paths";

export interface UrlParams {
  convertTo: "contributor";
}

interface LoaderResult {
  contributor: ProjectContributors.ProjectContributor;
  convertTo?: UrlParams["convertTo"];
}

export async function loader({ params, request }): Promise<LoaderResult> {
  const contributor = await ProjectContributors.getContributor({
    id: params.id,
    includeProject: true,
  }).then((data) => data.contributor!);

  const convertTo = Pages.getSearchParam(request, "convertTo") as UrlParams["convertTo"];

  return { contributor: contributor, convertTo: convertTo };
}

export function Page() {
  const { contributor } = Pages.useLoadedData();

  return (
    <Paper.Root size="small">
      <ProjectContribsSubpageNavigation project={contributor.project} />

      <Paper.Body>
        <Title />
        <Form />
      </Paper.Body>
    </Paper.Root>
  );
}

function Title() {
  const { convertTo, contributor } = Pages.useLoadedData() as LoaderResult;

  return match(convertTo)
    .with("contributor", () => (
      <>
        <div className="text-2xl font-extrabold pb-1">
          Reassign {People.firstName(contributor.person!)} as a Contributor
        </div>
        <div className="text-medium pb-8">
          {People.firstName(contributor.person!)} is currently a {contributor.role} on this project. Changing their role
          to contributor will update their responsibilities and access level to align with the new role.
        </div>
      </>
    ))
    .otherwise(() => (
      <div className="text-2xl font-extrabold pb-8">
        Edit {People.firstName(contributor.person!)}'s Role &amp; Access
      </div>
    ));
}

function Form() {
  const { contributor, convertTo } = Pages.useLoadedData() as LoaderResult;
  const [update] = ProjectContributors.useUpdateContributor();
  const gotoProjectContributors = useNavigateTo(Paths.projectContributorsPath(contributor.project!.id!));

  const form = Forms.useForm({
    fields: {
      responsibility: Forms.useTextField(contributor.responsibility),
      permissions: Forms.useSelectNumberField(PermissionLevels.EDIT_ACCESS, PERMISSIONS_LIST),
    },
    submit: async (form) => {
      let payload = {
        contribId: contributor.id,
        responsibility: form.fields.responsibility.value!,
        permissions: form.fields.permissions.value,
      };

      if (convertTo === "contributor") payload["role"] = "contributor";

      await update(payload);

      gotoProjectContributors();
    },
    cancel: async () => gotoProjectContributors(),
  });

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.TextInput
          field={"responsibility"}
          placeholder="e.g. Design the UI/UX for the project"
          label={"What is " + People.firstName(contributor.person!) + "'s responsibility on this project?"}
        />
        <Forms.SelectBox field={"permissions"} label="Access Level" />
      </Forms.FieldGroup>

      <Forms.Submit saveText="Save" />
    </Forms.Form>
  );
}
