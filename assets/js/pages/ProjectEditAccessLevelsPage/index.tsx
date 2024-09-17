import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Companies from "@/models/companies";
import * as Projects from "@/models/projects";
import * as Icons from "@tabler/icons-react";

import Forms from "@/components/Forms";

import { useEditProjectPermissions } from "@/api";
import { Paths } from "@/routes/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { ProjectContribsSubpageNavigation } from "@/components/ProjectPageNavigation";
import { useProjectAccessFields } from "@/features/Permissions/useAccessLevelsField";

interface LoaderResult {
  project: Projects.Project;
  company: Companies.Company;
}

export async function loader({ params }): Promise<LoaderResult> {
  const project = Projects.getProject({
    id: params.projectID,
    includeSpace: true,
    includeAccessLevels: true,
  }).then((data) => data.project!);

  const company = Companies.getCompany({
    id: params.companyId,
  }).then((data) => data.company!);

  return { project: await project, company: await company };
}

export function Page() {
  const { project } = Pages.useLoadedData();

  return (
    <Pages.Page title={["Edit General Access", project.name!]}>
      <Paper.Root size="medium">
        <ProjectContribsSubpageNavigation project={project} />

        <Paper.Body>
          <h1 className="text-2xl font-extrabold">Edit General Access for {project.name}</h1>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form() {
  const { project } = Pages.useLoadedData();

  const navigateToContributorsPath = useNavigateTo(Paths.projectContributorsPath(project.id!));
  const [edit] = useEditProjectPermissions();

  const form = Forms.useForm({
    fields: {
      access: useProjectAccessFields({
        isAdvanced: true,
        annonymousMembers: project.accessLevels!.public!,
        companyMembers: project.accessLevels!.company!,
        spaceMembers: project.accessLevels!.space!,
      }),
    },
    submit: async () => {
      await edit({
        projectId: project.id,
        accessLevels: {
          public: form.fields.access.fields.annonymousMembers.value,
          company: form.fields.access.fields.companyMembers.value,
          space: form.fields.access.fields.spaceMembers.value,
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
      <Forms.FieldGroup>
        <AccessSelectorAdvancedOptions />
      </Forms.FieldGroup>

      <Forms.Submit />
    </Forms.Form>
  );
}

function AccessSelectorAdvancedOptions() {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between border-t last:border-b border-stroke-subtle py-2.5">
        <div className="flex items-center gap-2 flex-1 w-2/3 font-semibold">
          <Icons.IconWorld size={20} />
          <span>People on the internet</span>
        </div>

        <div className="w-1/3">
          <Forms.SelectBox field={"access.annonymousMembers"} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t last:border-b border-stroke-subtle py-2.5">
        <div className="flex items-center gap-2 flex-1 w-2/3 font-semibold">
          <Icons.IconBuilding size={20} />
          <span>Company members</span>
        </div>

        <div className="w-1/3">
          <Forms.SelectBox field={"access.companyMembers"} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t last:border-b border-stroke-subtle py-2.5">
        <div className="flex items-center gap-2 flex-1 w-2/3 font-semibold">
          <Icons.IconTent size={20} className="text-content-accent" strokeWidth={2} />
          <span>Space members</span>
        </div>

        <div className="w-1/3">
          <Forms.SelectBox field={"access.spaceMembers"} />
        </div>
      </div>
    </div>
  );
}
