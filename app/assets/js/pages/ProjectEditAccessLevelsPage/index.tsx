import * as React from "react";

import Api from "@/api";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";

import { Forms } from "turboui";

import { ProjectContribsSubpageNavigation } from "@/components/ProjectPageNavigation";
import {
  applyAccessLevelConstraints,
  initialAccessLevels,
  UNRESTRICTED_PARENT_ACCESS,
} from "@/features/Permissions/AccessFields";
import { PageModule } from "@/routes/types";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { usePaths } from "@/routes/paths";
export default { name: "ProjectEditAccessLevelsPage", loader, Page } as PageModule;

interface LoaderResult {
  project: Projects.Project;
}

async function loader({ params }): Promise<LoaderResult> {
  const project = await Projects.getProject({
    id: params.projectID,
    includeSpace: true,
    includeAccessLevels: true,
  }).then((data) => data.project!);

  return { project };
}

function Page() {
  const { project } = Pages.useLoadedData<LoaderResult>();

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
  const paths = usePaths();
  const { project } = Pages.useLoadedData<LoaderResult>();

  const navigateToContributorsPath = useNavigateTo(paths.projectContributorsPath(project.id!));
  const [updatePermissions] = Api.projects.useUpdatePermissions();

  const form = Forms.useForm({
    fields: {
      access: initialAccessLevels(project.accessLevels!, UNRESTRICTED_PARENT_ACCESS),
    },
    onChange: ({ newValues }) => {
      newValues.access = applyAccessLevelConstraints(newValues.access, UNRESTRICTED_PARENT_ACCESS);
    },
    submit: async () => {
      await updatePermissions({
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
      <Forms.AccessSelectors />
      <Forms.Submit />
    </Forms.Form>
  );
}
