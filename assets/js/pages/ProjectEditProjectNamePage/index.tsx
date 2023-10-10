import React from "react";
import * as Icons from "@tabler/icons-react";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as Paper from "@/components/PaperContainer";
import * as Forms from "@/components/Form";

import { useDocumentTitle } from "@/layouts/header";
import { useNavigateTo } from "@/routes/useNavigateTo";

interface LoaderResult {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderResult> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  return {
    project: projectData.data.project,
  };
}

export function Page() {
  const [{ project }] = Paper.useLoadedData() as [LoaderResult, () => void];

  useDocumentTitle(`Edit Project Name - ${project.name}`);

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <h1 className="mb-8 font-extrabold text-white-1 text-3xl">Editing the project's name</h1>
        <Form project={project} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Form({ project }) {
  const navigateToProject = useNavigateTo(`/projects/${project.id}`);

  const [projectName, setProjectName] = React.useState(project.name);

  const [edit, { loading }] = Projects.useEditProjectName({
    onCompleted: () => navigateToProject(),
  });

  const handleSubmit = () => {
    edit({
      variables: {
        input: {
          name: projectName,
        },
      },
    });
  };

  const handleCancel = () => navigateToProject();

  const isValid = projectName.length > 0;

  return (
    <Forms.Form onSubmit={handleSubmit} loading={loading} isValid={isValid} onCancel={handleCancel}>
      <div className="flex flex-col gap-6">
        <Forms.TextInput
          label="New Project Name"
          value={projectName}
          onChange={setProjectName}
          placeholder="e.g. HR System Update"
          data-test-id="project-name-input"
        />
      </div>

      <Forms.SubmitArea>
        <Forms.SubmitButton data-test-id="save">Save</Forms.SubmitButton>
        <Forms.CancelButton>Cancel</Forms.CancelButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}
