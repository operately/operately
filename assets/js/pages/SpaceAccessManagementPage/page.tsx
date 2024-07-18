import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { Paths } from "@/routes/paths";
import { Space } from "@/api";

import { useLoadedData } from "./loader";
import { MembersAccessLevel } from "./MembersAccessLevel";
import { AddMembers } from "./AddMembers";
import { SpaceAccessLevel } from "./SpaceAccessLevel";

import { PermissionsProvider } from "@/features/Permissions/PermissionsContext";
import { Spacer } from "@/components/Spacer";


export function Page() {
  const { space, company } = useLoadedData();

  return (
    <Pages.Page title={space.name!}>
      <Paper.Root>
        <Navigation space={space} />

        <Paper.Body>
          <AddMembers space={space} />
          <Spacer size={4} />
          <MembersAccessLevel />
          <SpacesWithLine />
          <PermissionsProvider company={company} space={space} currentPermissions={space.accessLevels} >
            <SpaceAccessLevel />
          </PermissionsProvider>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
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

function SpacesWithLine() {
  return <div className="bg-content-subtle h-[1px] w-full mt-12 mb-10" />;
}
