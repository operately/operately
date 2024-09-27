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
import { DEFAULT_ANNONYMOUS_OPTIONS, DEFAULT_COMPANY_OPTIONS, DEFAULT_SPACE_OPTIONS } from "@/features/Permissions";

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
      <Paper.Root size="medium">
        <ProjectContribsSubpageNavigation project={project} />

        <Paper.Body>
          <h1 className="text-2xl font-extrabold">Edit access for {project.name}</h1>
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
      access: {
        isAdvanced: true,
        annonymousMembers: project.accessLevels!.public!,
        annonynousMembersOptions: DEFAULT_ANNONYMOUS_OPTIONS,
        companyMembers: project.accessLevels!.company!,
        companyMembersOptions: DEFAULT_COMPANY_OPTIONS,
        spaceMembers: project.accessLevels!.space!,
        spaceMembersOptions: DEFAULT_SPACE_OPTIONS,
      },
    },
    onChange: (values) => {
      if (parentAccessLevel.public! >= values.access.annonymousMembers) {
        values.access.annonymousMembers = parentAccessLevel.public!;
      }

      if (parentAccessLevel.company! >= values.access.companyMembers) {
        values.access.companyMembers = parentAccessLevel.company!;
      }

      if (values.access.companyMembers < values.access.annonymousMembers) {
        values.access.annonymousMembers = values.access.companyMembers;
      }

      if (values.access.spaceMembers < values.access.companyMembers) {
        values.access.companyMembers = values.access.spaceMembers;
      }

      values.access.annonynousMembersOptions = DEFAULT_ANNONYMOUS_OPTIONS.filter(
        (option) => option.value <= parentAccessLevel.public!,
      );

      values.access.companyMembersOptions = DEFAULT_COMPANY_OPTIONS.filter(
        (option) => option.value <= parentAccessLevel.company! && option.value >= values.access.annonymousMembers,
      );
    },
    submit: async () => {
      await edit({
        projectId: project.id,
        accessLevels: {
          public: form.values.access.annonymousMembers,
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
