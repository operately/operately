import React from "react";

import * as Forms from "@/components/Form";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
export function Page() {
  const paths = usePaths();
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Edit Project Name", project.name!]}>
      <Paper.Root>
        <Paper.Navigation items={[{ to: paths.projectPath(project.id!), label: project.name! }]} />

        <Paper.Body>
          <h1 className="mb-8 font-extrabold text-content-accent text-3xl">Editing the project's name</h1>
          <Form project={project} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form({ project }: { project: Projects.Project }) {
  const paths = usePaths();
  const navigateToProject = useNavigateTo(paths.projectPath(project.id!));
  const [projectName, setProjectName] = React.useState(project.name);

  const [edit, { loading }] = Projects.useEditProjectName();

  const handleSubmit = async () => {
    await edit({ projectId: project.id, name: projectName });
    navigateToProject();
  };

  const handleCancel = () => navigateToProject();

  const isValid = projectName ? projectName.length > 0 : false;

  return (
    <Forms.Form onSubmit={handleSubmit} loading={loading} isValid={isValid} onCancel={handleCancel}>
      <div className="flex flex-col gap-6">
        <Forms.TextInput
          label="New Project Name"
          value={projectName}
          onChange={setProjectName}
          placeholder="e.g. HR System Update"
          data-test-id="project-name-input"
          error={!isValid}
        />
      </div>

      <Forms.SubmitArea>
        <Forms.SubmitButton testId="save">Save</Forms.SubmitButton>
        <Forms.CancelButton>Cancel</Forms.CancelButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}
