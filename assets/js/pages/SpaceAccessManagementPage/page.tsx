import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { useLoadedData } from "./loader";

import { Space } from "@/api";
import { Paths } from "@/routes/paths";


export function Page() {
  const { space } = useLoadedData();

  return (
    <Pages.Page title={"SpaceAccessManagementPage"}>
      <Paper.Root>
        <Navigation space={space} />

        <Paper.Body>
          <AddMembers />
          <MembersAccessLevel />
          <SpaceAccessLevel />
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

function AddMembers() {
  return (
    <div></div>
  );
}

function MembersAccessLevel() {
  return (
    <div></div>
  );
}

function SpaceAccessLevel() {
  return (
    <div></div>
  );
}
