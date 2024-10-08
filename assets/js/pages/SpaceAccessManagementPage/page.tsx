import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { Paths } from "@/routes/paths";
import { Space } from "@/models/spaces";

import { useLoadedData } from "./loader";
import { MembersAccessLevel } from "./MembersAccessLevel";
import { AddMembers } from "./AddMembers";
import { SpaceAccessLevel } from "./SpaceAccessLevel";

import { usePermissionsState } from "@/features/Permissions/usePermissionsState";
import { Spacer } from "@/components/Spacer";

export function Page() {
  const { space, company } = useLoadedData();
  const permissions = usePermissionsState({ company, space, currentPermissions: space.accessLevels });

  return (
    <Pages.Page title={space.name!}>
      <Paper.Root>
        <Navigation space={space} />

        <Paper.Body>
          <Title />
          <AddMembers space={space} />
          <Spacer size={4} />
          <MembersAccessLevel />
          <SpacerWithLine />
          <SpaceAccessLevel state={permissions} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title() {
  return (
    <div className="rounded-t-[20px] pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold ">Team &amp; Access</div>
          <div className="text-medium">Manage the team and access to this space</div>
        </div>
      </div>
    </div>
  );
}

function Navigation({ space }: { space: Space }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spacePath(space.id!)}>
        {React.createElement(Icons[space.icon!], { size: 16, className: space.color })}
        {space.name}
      </Paper.NavItem>
    </Paper.Navigation>
  );
}

function SpacerWithLine() {
  return <div className="bg-content-subtle h-[1px] w-full mt-12 mb-10" />;
}
