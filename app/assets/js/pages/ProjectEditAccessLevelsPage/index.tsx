import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";
import * as Spaces from "@/models/spaces";
import * as React from "react";

import Forms from "@/components/Forms";

import { useEditProjectPermissions } from "@/api";
import { ProjectContribsSubpageNavigation } from "@/components/ProjectPageNavigation";
import { applyAccessLevelConstraints, initialAccessLevels } from "@/features/Permissions/AccessFields";
import { AccessSelectors } from "@/features/projects/AccessSelectors";
import { DeprecatedPaths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { useNavigateTo } from "@/routes/useNavigateTo";

export default { name: "ProjectEditAccessLevelsPage", loader, Page } as PageModule;

interface LoaderResult {
  project: Projects.Project;
  space: Spaces.Space;
}

async function loader({ params }): Promise<LoaderResult> {
  const project = await Projects.getProject({
    id: params.projectID,
    includeSpace: true,
    includeAccessLevels: true,
  }).then((data) => data.project!);

  const space = await Spaces.getSpace({ id: project.space!.id, includeAccessLevels: true });

  return { project: project, space: space };
}

function Page() {
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

  const navigateToContributorsPath = useNavigateTo(DeprecatedPaths.projectContributorsPath(project.id!));
  const [edit] = useEditProjectPermissions();

  const form = Forms.useForm({
    fields: {
      access: initialAccessLevels(project.accessLevels!, parentAccessLevel),
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
