import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as ProjectContributors from "@/models/projectContributors";

import Forms from "@/components/Forms";
import { PageTitle } from "./PageTitle";
import { LoaderResult, useGotoProjectContributors } from "./loader";
import { useAccessLevelField } from "./useAccessLevelField";
import { PermissionLevels } from "@/features/Permissions";
import { joinStr } from "@/utils/strings";

export function ReassignAsContributor() {
  const { contributor } = Pages.useLoadedData() as LoaderResult;

  const form = useForm(contributor);

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

export function useForm(contributor: ProjectContributors.ProjectContributor) {
  const [update] = ProjectContributors.useUpdateContributor();
  const gotoProjectContrib = useGotoProjectContributors();

  return Forms.useForm({
    fields: {
      responsibility: Forms.useTextField(contributor.responsibility),
      permissions: useAccessLevelField(PermissionLevels.FULL_ACCESS),
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
}