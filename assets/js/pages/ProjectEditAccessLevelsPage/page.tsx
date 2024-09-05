import * as Icons from "@tabler/icons-react";
import React from "react";

import * as Forms from "@/components/Form";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { useEditProjectPermissions } from "@/api";
import { ResourcePermissionSelector } from "@/features/Permissions";
import { Paths } from "@/routes/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { useLoadedData } from "./loader";
import { usePermissionsState } from "@/features/Permissions/usePermissionsState";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Edit Project Permissions", project.name!]}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo={Paths.projectPath(project.id!)}>
            <Icons.IconClipboardList size={16} />
            {project.name}
          </Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <h1 className="mb-8 font-extrabold text-content-accent text-3xl">Editing the project&apos;s permissions</h1>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form() {
  const { project, company } = useLoadedData();

  const navigateToProject = useNavigateTo(Paths.projectPath(project.id!));
  const [edit, { loading }] = useEditProjectPermissions();
  const permissions = usePermissionsState({ company, space: project.space, currentPermissions: project.accessLevels });

  const handleSubmit = async () => {
    edit({
      projectId: project.id,
      accessLevels: permissions.permissions,
    }).then(() => {
      navigateToProject();
    });
  };

  const handleCancel = () => navigateToProject();

  return (
    <Forms.Form onSubmit={handleSubmit} loading={loading} isValid={true} onCancel={handleCancel}>
      <div className="flex flex-col gap-6">
        <ResourcePermissionSelector state={permissions} />
      </div>

      <Forms.SubmitArea>
        <Forms.SubmitButton data-test-id="save">Save</Forms.SubmitButton>
        <Forms.CancelButton>Cancel</Forms.CancelButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}
