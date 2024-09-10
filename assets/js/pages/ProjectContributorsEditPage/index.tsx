import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as ProjectContributors from "@/models/projectContributors";

import Forms from "@/components/Forms";
import { ProjectContribsSubpageNavigation } from "@/components/ProjectPageNavigation";
import { Paths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";

interface LoaderResult {
  contributor: ProjectContributors.ProjectContributor;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    contributor: await ProjectContributors.getContributor({
      id: params.id,
      includeProject: true,
    }).then((data) => data.contributor!),
  };
}

export function Page() {
  const { contributor } = Pages.useLoadedData();

  return (
    <Paper.Root>
      <ProjectContribsSubpageNavigation project={contributor.project} />

      <Paper.Body>
        <div className="text-2xl font-extrabold pb-8">Edit Contributor</div>

        <Form />
      </Paper.Body>
    </Paper.Root>
  );
}

function Form() {
  const { contributor } = Pages.useLoadedData() as LoaderResult;
  const [update] = ProjectContributors.useUpdateContributor();
  const navigate = useNavigate();

  const form = Forms.useForm({
    fields: {
      responsibility: Forms.useTextField(contributor.responsibility),
    },
    submit: async (form) => {
      await update({
        contribId: contributor.id,
        responsibility: form.fields.responsibility.value!,
      });

      navigate(Paths.projectContributorsPath(contributor.project!.id!));
    },
    cancel: async () => navigate(Paths.projectContributorsPath(contributor.project!.id!)),
  });

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.TextInput
          field={"responsibility"}
          placeholder="e.g. Project Manager"
          label={"Responsibility on this project"}
        />
      </Forms.FieldGroup>

      <Forms.Submit saveText="Save" />
    </Forms.Form>
  );
}
