import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";
import * as Spaces from "@/models/spaces";

import Forms from "@/components/Forms";

import { useEditProjectPermissions } from "@/api";
import { Paths } from "@/routes/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { ProjectContribsSubpageNavigation } from "@/components/ProjectPageNavigation";
import { AccessSelectors } from "@/features/projects/AccessSelectors";
import { initialAccessLevels, applyAccessLevelConstraints } from "@/features/projects/AccessFields";

interface LoaderResult {
  project: Projects.Project;
  space: Spaces.Space;
}

export async function loader({ params }): Promise<LoaderResult> {
  const project = await Projects.getProject({
    id: params.projectID,
    includeSpace: true,
    includeAccessLevels: true,
  }).then((data) => data.project!);

  const space = await Spaces.getSpace({ id: project.space!.id, includeAccessLevels: true });

  return { project: project, space: space };
}

export function Page() {
  const { project } = Pages.useLoadedData();

  return (
    <Pages.Page title={["Edit General Access", project.name!]}>
      <Paper.Root size="small">
        <ProjectContribsSubpageNavigation project={project} />

        <Paper.Body>
          <h1 className="text-2xl font-extrabold">Edit General Access</h1>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form() {
  const { project, space } = Pages.useLoadedData();
  const parentAccessLevel = space.accessLevels!;

  const navigateToContributorsPath = useNavigateTo(Paths.projectContributorsPath(project.id!));
  const [edit] = useEditProjectPermissions();

  const form = Forms.useForm({
    fields: {
      access: initialAccessLevels(parentAccessLevel),
    },
    onChange: ({ newValues }) => {
      newValues.access = applyAccessLevelConstraints(newValues.access, parentAccessLevel);
    },
    submit: async () => {
      await edit({
        projectId: project.id,
        accessLevels: {
          public: form.values.access.anonymous,
          company: form.values.access.companyMembers,
          space: form.values.access.spaceMembers,
        },
      });

      navigateToContributorsPath();
    },
    cancel: async () => {
      navigateToContributorsPath();
    },
  });

  return (
    <Forms.Form form={form}>
      <AccessSelectors />
      <Forms.Submit />
    </Forms.Form>
  );
}
