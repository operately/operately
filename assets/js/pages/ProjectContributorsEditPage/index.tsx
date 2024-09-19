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
import { joinStr } from "@/utils/strings";

import { EditContributor } from "./EditContributor";
import { ReassignAsContributor } from "./ReassignAsContributor";

export { loader } from "./loader";

export function Page() {
  const { contributor, action } = Pages.useLoadedData();

  return (
    <Paper.Root size="small">
      <ProjectContribsSubpageNavigation project={contributor.project} />

      {match(action)
        .with("edit-contributor", () => <EditContributor />)
        .with("change-champion", () => <ChangeChampion />)
        .with("change-reviewer", () => <ChangeReviewer />)
        .with("reassign-as-contributor", () => <ReassignAsContributor />)
        .run()}
    </Paper.Root>
  );
}

function ReassignAsContributor() {
  const { contributor } = Pages.useLoadedData() as LoaderResult;

  const [update] = ProjectContributors.useUpdateContributor();
  const gotoProjectContrib = useGotoProjectContributors();

  const form = Forms.useForm({
    fields: {
      responsibility: Forms.useTextField(contributor.responsibility),
      permissions: Forms.useSelectNumberField(PermissionLevels.EDIT_ACCESS, PERMISSIONS_LIST),
    },
    submit: async (form) => {
      await update({
        contribId: contributor.id,
        responsibility: form.fields.responsibility.value!,
        permissions: form.fields.permissions.value,
        role: "contributor",
      });

      gotoProjectContrib();
    },
    cancel: gotoProjectContrib,
  });

  const name = People.firstName(contributor.person!);
  const title = `Reassign ${name} as a Contributor`;

  const subtitle = joinStr(
    `${name} is currently the ${contributor.role} on this project. `,
    "Changing their role to contributor will modify ",
    "their access and responsibilities.",
  );

  const placeholder = "e.g. Design the UI/UX for the project";
  const label = `What is ${name}'s responsibility on this project?`;

  return (
    <Paper.Body>
      <Forms.Form form={form}>
        <PageTitle title={title} subtitle={subtitle} />

        <Forms.FieldGroup>
          <Forms.TextInput field={"responsibility"} placeholder={placeholder} label={label} />
          <Forms.SelectBox field={"permissions"} label="Access Level" />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Save" />
      </Forms.Form>
    </Paper.Body>
  );
}

function useGotoProjectContributors() {
  const { contributor } = Pages.useLoadedData() as LoaderResult;
  return useNavigateTo(Paths.projectContributorsPath(contributor.project!.id!));
}
