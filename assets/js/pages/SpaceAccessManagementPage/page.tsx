import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as People from "@/models/people";

import { Paths } from "@/routes/paths";
import { Space } from "@/models/spaces";

import { useLoadedData } from "./loader";
import { MembersAccessLevel } from "./MembersAccessLevel";
import { AddMembers } from "./AddMembers";
import { SpaceAccessLevel } from "./SpaceAccessLevel";

import { usePermissionsState } from "@/features/Permissions/usePermissionsState";
import { Spacer } from "@/components/Spacer";
import { joinStr } from "@/utils/strings";
import { assertPresent } from "@/utils/assertions";
import { PermissionLevels } from "@/features/Permissions";
import { ProjectAccessLevelBadge } from "@/components/Badges/AccessLevelBadges";
import { BorderedRow } from "@/components/BorderedRow";
import { ContributorAvatar } from "@/components/ContributorAvatar";
import Avatar from "@/components/Avatar";

export function Page() {
  const { space, company } = useLoadedData();
  const permissions = usePermissionsState({ company, space, currentPermissions: space.accessLevels });

  return (
    <Pages.Page title={space.name!}>
      <Paper.Root>
        <Navigation space={space} />

        <Paper.Body>
          <Title />
          <SpaceManagers />
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
    <div className="rounded-t-[20px] pb-8">
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

function SpaceManagers() {
  const { space } = useLoadedData();

  assertPresent(space.members, "Space members must be present");

  const subtitle = joinStr(
    "They have unrestricted access to resources in this space, including managing the team and access levels.",
  );

  const managers = space.members.filter((member) => member.accessLevel === PermissionLevels.FULL_ACCESS);

  return (
    <Paper.Section title="Space Managers" subtitle={subtitle}>
      <div className="mt-4">
        {managers.map((contrib) => (
          <Member member={contrib} key={contrib.id} />
        ))}
      </div>
    </Paper.Section>
  );
}

function Member({ member }: { member: People.Person }) {
  return (
    <BorderedRow>
      <div className="flex items-center gap-2">
        <Avatar person={member} size={40} />
        <MemberName member={member} />
      </div>
      <div className="flex items-center gap-4"></div>
    </BorderedRow>
  );
}

function MemberName({ member }: { member: People.Person }) {
  return (
    <div className="flex flex-col flex-1">
      <div className="font-bold flex items-center gap-2">{member.fullName}</div>
      <div className="text-sm font-medium flex items-center">{member.title}</div>
    </div>
  );
}
