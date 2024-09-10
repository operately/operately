import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";

import { PERMISSIONS_LIST, PermissionLevels } from "@/features/Permissions";
import { ProjectContribsSubpageNavigation } from "@/components/ProjectPageNavigation";
import { useAddProjectContributor } from "@/api";

import Forms from "@/components/Forms";
import { Paths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";

interface LoaderResult {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    project: await Projects.getProject({
      id: params.projectID,
      includePermissions: true,
    }).then((data) => data.project!),
  };
}

export function Page() {
  const { project } = Pages.useLoadedData() as LoaderResult;

  return (
    <Paper.Root>
      <ProjectContribsSubpageNavigation project={project} />

      <Paper.Body>
        <div className="text-2xl font-extrabold pb-8">Add Contributor</div>

        <Form />
      </Paper.Body>
    </Paper.Root>
  );
}

function Form() {
  const navigate = useNavigate();
  const { project } = Pages.useLoadedData() as LoaderResult;
  const [add] = useAddProjectContributor();

  const form = Forms.useForm({
    fields: {
      person: Forms.useSelectPersonField(),
      responsibility: Forms.useTextField(""),
      permissions: Forms.useSelectNumberField(PermissionLevels.EDIT_ACCESS, PERMISSIONS_LIST),
    },
    submit: async (form) => {
      await add({
        projectId: project.id,
        personId: form.fields.person.value!.id!,
        responsibility: form.fields.responsibility.value!,
        permissions: form.fields.permissions.value,
      });

      navigate(Paths.projectContributorsPath(project.id!));
    },
    cancel: async () => navigate(Paths.projectContributorsPath(project.id!)),
  });

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.FieldGroup layout="grid" gridColumns={2}>
          <Forms.SelectPerson field={"person"} label="Contributor" />
          <Forms.SelectBox field={"permissions"} label="Access Level" />
        </Forms.FieldGroup>
        <Forms.TextInput field={"responsibility"} placeholder="e.g. Project Manager" label="Responsibility" />
      </Forms.FieldGroup>

      <Forms.Submit saveText="Add Contributor" secondarySubmitText="Save &amp; Add Another" />
    </Forms.Form>
  );
}
