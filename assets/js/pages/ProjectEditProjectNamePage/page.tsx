import React from "react";
import * as Icons from "@tabler/icons-react";

import * as Projects from "@/models/projects";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Forms from "@/components/Form";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { useLoadedData } from "./loader";
import { Paths } from "@/routes/paths";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Edit Project Name", project.name!]}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo={Paths.projectPath(project.id!)}>
            <Icons.IconClipboardList size={16} />
            {project.name}
          </Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <h1 className="mb-8 font-extrabold text-content-accent text-3xl">Editing the project's name</h1>
          <Form project={project} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form({ project }: { project: Projects.Project }) {
  const navigateToProject = useNavigateTo(Paths.projectPath(project.id!));
  const [projectName, setProjectName] = React.useState(project.name);

  const [edit, { loading }] = Projects.useEditNameMutation({
    onCompleted: () => navigateToProject(),
  });

  const handleSubmit = () => {
    edit({
      variables: {
        input: {
          projectId: project.id,
          name: projectName,
        },
      },
    });
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
        <Forms.SubmitButton data-test-id="save">Save</Forms.SubmitButton>
        <Forms.CancelButton>Cancel</Forms.CancelButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}
