import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as People from "@/models/people";

import { Paths } from "@/routes/paths";
import { Space } from "@/models/spaces";

import { useLoadedData } from "./loader";
import { AddMembers } from "./AddMembers";
import { SpaceAccessLevel } from "./SpaceAccessLevel";

import { usePermissionsState } from "@/features/Permissions/usePermissionsState";
import { Spacer } from "@/components/Spacer";
import { assertPresent } from "@/utils/assertions";
import { PermissionLevels } from "@/features/Permissions";
import { BorderedRow } from "@/components/BorderedRow";
import { Menu, MenuActionItem } from "@/components/Menu";
import { useRemoveGroupMember } from "@/models/spaces";

import Avatar from "@/components/Avatar";
import { createTestId } from "@/utils/testid";
import { SpaceAccessLevbelBadge } from "@/components/Badges/AccessLevelBadges";
import { SecondaryButton } from "@/components/Buttons";
import { AccessLevel } from "@/features/spaces";

export function Page() {
  const { space, company } = useLoadedData();
  const permissions = usePermissionsState({ company, space, currentPermissions: space.accessLevels });

  return (
    <Pages.Page title={space.name!}>
      <Paper.Root>
        <Navigation space={space} />

        <Paper.Body>
          <Title />
          <GeneralAccess />
          <SpaceManagers />
          <SpaceMembers />
          <AddMembers space={space} />
          <Spacer size={4} />
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

function GeneralAccess() {
  const { space } = useLoadedData();
  const editPath = Paths.spaceEditGeneralAccessPath(space.id!);

  assertPresent(space.accessLevels, "Space access levels must be present");

  return (
    <Paper.Section title="General Access">
      <BorderedRow>
        <AccessLevel anonymous={space.accessLevels.public!} company={space.accessLevels.company!} tense="present" />
        <SecondaryButton linkTo={editPath} size="xs">
          Edit
        </SecondaryButton>
      </BorderedRow>
    </Paper.Section>
  );
}

function SpaceManagers() {
  const { space } = useLoadedData();

  assertPresent(space.members, "Space members must be present");

  const subtitle = "Managers have full access to resources in this space, including team and access management.";
  const managers = space.members.filter((member) => member.accessLevel === PermissionLevels.FULL_ACCESS);

  return (
    <Paper.Section title="Space Managers" subtitle={subtitle}>
      {managers.map((contrib) => (
        <Member member={contrib} key={contrib.id} />
      ))}
    </Paper.Section>
  );
}

function SpaceMembers() {
  const { space } = useLoadedData();

  assertPresent(space.members, "Space members must be present");

  const managers = space.members.filter((member) => member.accessLevel !== PermissionLevels.FULL_ACCESS);

  return (
    <Paper.Section title="Members">
      {managers.map((contrib) => (
        <Member member={contrib} key={contrib.id} />
      ))}
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
      <div className="flex items-center gap-4">
        <SpaceAccessLevbelBadge accessLevel={member.accessLevel!} />
        <MemberMenu member={member} />
      </div>
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

function MemberMenu({ member }: { member: People.Person }) {
  return (
    <Menu testId={createTestId("member-menu", member!.fullName!)} size="medium">
      <RemoveMemberMenuItem member={member} />
    </Menu>
  );
}

function RemoveMemberMenuItem({ member }: { member: People.Person }) {
  const { space } = useLoadedData();
  const refresh = Pages.useRefresh();
  const [remove] = useRemoveGroupMember();

  const handleClick = async () => {
    await remove({ groupId: space.id, memberId: member.id });
    refresh();
  };

  return (
    <MenuActionItem danger={true} onClick={handleClick} testId="remove-member">
      Remove from space
    </MenuActionItem>
  );
}
