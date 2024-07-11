import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Forms from "@/components/Form";

import { useLoadedData } from "./loader";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { Paths } from "@/routes/paths";
import { Space, useEditSpacePermissions } from "@/api";
import { IconClipboardList } from "@tabler/icons-react";
import { PermissionsProvider } from "@/features/Permissions/PermissionsContext";
import { usePermissionsContext } from "@/features/Permissions/PermissionsContext";
import { SpacePermissionSelector } from "@/features/Permissions";


export function Page() {
  const { space, company } = useLoadedData();
  
  return (
    <Pages.Page title={["Edit Space Permissions", space.name!]}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo={Paths.spacePath(space.id!)}>
            <IconClipboardList size={16} />
            {space.name}
          </Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <h1 className="mb-8 font-extrabold text-content-accent text-3xl">Editing the space&apos;s permissions</h1>
          <PermissionsProvider company={company} space={space} currentPermissions={space.accessLevels} >
            <Form space={space} />
          </PermissionsProvider>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form({ space }: { space: Space }) {
  const navigateToSpace = useNavigateTo(Paths.spacePath(space.id!));
  const { permissions } = usePermissionsContext();
  const [edit, { loading }] = useEditSpacePermissions();

  const handleSubmit = async () => {
    edit({
      spaceId: space.id,
      accessLevels: permissions,
    })
    .then(() => {
      navigateToSpace();
    })
  };

  const handleCancel = () => navigateToSpace();

  return (
    <Forms.Form onSubmit={handleSubmit} loading={loading} isValid={true} onCancel={handleCancel} >
      <div className="flex flex-col gap-6">
        <SpacePermissionSelector />
      </div>

      <Forms.SubmitArea>
        <Forms.SubmitButton data-test-id="save">Save</Forms.SubmitButton>
        <Forms.CancelButton>Cancel</Forms.CancelButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}