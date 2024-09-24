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
import { DEFAULT_ANNONYMOUS_OPTIONS, DEFAULT_COMPANY_OPTIONS, DEFAULT_SPACE_OPTIONS } from "@/features/Permissions";

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
          <h1 className="text-2xl font-extrabold">Edit access for {project.name}</h1>
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
      access: {
        isAdvanced: true,
        annonymousMembers: project.accessLevels!.public!,
        companyMembers: project.accessLevels!.company!,
        spaceMembers: project.accessLevels!.space!,
      },
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
      <Forms.FieldGroup>
        <AccessSelectorAdvancedOptions />
      </Forms.FieldGroup>

      <Forms.Submit />
    </Forms.Form>
  );
}

function AccessSelectorAdvancedOptions() {
  const [annonymousMembers] = Forms.useFieldValue("access.annonymousMembers");
  const [companyMembers, setCompanyMembers] = Forms.useFieldValue("access.companyMembers");
  const [spaceMembers, setSpaceMembers] = Forms.useFieldValue("access.spaceMembers");

  const [annonymousAccessOptions] = React.useState(DEFAULT_ANNONYMOUS_OPTIONS);
  const [companyAccessOptions, setCompanyAccessOptions] = React.useState(DEFAULT_COMPANY_OPTIONS);
  const [spaceAccessOptions, setSpaceAccessOptions] = React.useState(DEFAULT_SPACE_OPTIONS);

  React.useEffect(() => {
    if (companyMembers < annonymousMembers) {
      setCompanyMembers(annonymousMembers);
    }

    const options = DEFAULT_COMPANY_OPTIONS.filter((option) => option.value >= annonymousMembers);
    setCompanyAccessOptions(options);
  }, [annonymousMembers]);

  React.useEffect(() => {
    if (spaceMembers < companyMembers) {
      setSpaceMembers(companyMembers);
    }

    const options = DEFAULT_SPACE_OPTIONS.filter((option) => option.value >= companyMembers);
    setSpaceAccessOptions(options);
  }, [companyMembers]);

  return (
    <div className="mt-6">
      <Forms.FieldGroup layout="horizontal" layoutOptions={{ dividers: true, ratio: "1:1" }}>
        <Forms.SelectBox
          field={"access.annonymousMembers"}
          label="People on the internet"
          labelIcon={<Icons.IconWorld size={20} />}
          options={annonymousAccessOptions}
        />
        <Forms.SelectBox
          field={"access.companyMembers"}
          label="Company members"
          labelIcon={<Icons.IconBuilding size={20} />}
          options={companyAccessOptions}
        />
        <Forms.SelectBox
          field={"access.spaceMembers"}
          label="Space members"
          labelIcon={<Icons.IconTent size={20} />}
          options={spaceAccessOptions}
        />
      </Forms.FieldGroup>
    </div>
  );
}
