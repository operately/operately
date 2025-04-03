import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as ProjectContributors from "@/models/projectContributors";

import Forms from "@/components/Forms";
import { PageTitle } from "./PageTitle";
import { LoaderResult, useGotoProjectContributors } from "./loader";
import { joinStr } from "@/utils/strings";
import { compareIds } from "@/routes/paths";

export function ChangeChampion() {
  const { contributor } = Pages.useLoadedData() as LoaderResult;

  const form = useForm(contributor);

  const name = People.firstName(contributor.person!);
  const title = `Edit project champion`;

  const subtitle = joinStr(
    `${name} is currently the ${contributor.role} on this project. `,
    `If you select a new champion, ${name} will be reassigned as a contributor.`,
  );

  return (
    <Paper.Body>
      <Forms.Form form={form}>
        <PageTitle title={title} subtitle={subtitle} />

        <Forms.FieldGroup>
          <Forms.SelectPerson field={"person"} label="Project Champion" default={contributor.person} />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Save" />
      </Forms.Form>
    </Paper.Body>
  );
}

function useForm(contributor: ProjectContributors.ProjectContributor) {
  const [update] = ProjectContributors.useUpdateContributor();
  const gotoProjectContrib = useGotoProjectContributors();

  const form = Forms.useForm({
    fields: {
      person: contributor.person?.id,
    },
    submit: async () => {
      if (!compareIds(form.values.person, contributor.person?.id)) {
        await update({
          contribId: contributor.id,
          personId: form.values.person,
          role: "champion",
        });
      }

      gotoProjectContrib();
    },
    cancel: gotoProjectContrib,
  });

  return form;
}
