import React from "react";
import * as Icons from "@tabler/icons-react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Forms from "@/components/Form";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { useLoadedData } from "./loader";
import { Paths } from "@/routes/paths";
import { Project } from "@/models/projects";
import { PermissionsProvider, usePermissionsContext } from "@/features/Permissions/PermissionsContext";
import { ResourcePermissionSelector } from "@/features/Permissions";
import { useEditProjectPermissions } from "@/api";

export function Page() {
  const { project, company } = useLoadedData();
  
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
          <h1 className="mb-8 font-extrabold text-content-accent text-3xl">Editing the project's permissions</h1>
          <PermissionsProvider company={company} space={project.space} currentPermissions={project.accessLevels} >
            <Form project={project} />
          </PermissionsProvider>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form({ project }: { project: Project }) {
  const navigateToProject = useNavigateTo(Paths.projectPath(project.id!));
  const { permissions } = usePermissionsContext();
  const [edit, { loading }] = useEditProjectPermissions();

  const handleSubmit = async () => {
    edit({
      projectId: project.id,
      accessLevels: permissions,
    })
    .then(() => {
      navigateToProject();
    })
  };

  const handleCancel = () => navigateToProject();

  return (
    <Forms.Form onSubmit={handleSubmit} loading={loading} isValid={true} onCancel={handleCancel} >
      <div className="flex flex-col gap-6">
        <ResourcePermissionSelector />
      </div>

      <Forms.SubmitArea>
        <Forms.SubmitButton data-test-id="save">Save</Forms.SubmitButton>
        <Forms.CancelButton>Cancel</Forms.CancelButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}
