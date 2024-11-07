import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";

import { Paths } from "@/routes/paths";
import { Space } from "@/models/spaces";
import { AccessLevel } from "@/features/spaces";
import { OtherPeople } from "./OtherPeople";
import { BorderedRow } from "@/components/BorderedRow";
import { PermissionLevels } from "@/features/Permissions";
import { Menu, MenuActionItem, SubMenu } from "@/components/Menu";
import { SpaceAccessLevelBadge } from "@/components/Badges/AccessLevelBadges";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";

import { createTestId } from "@/utils/testid";
import { useLoadedData } from "./loader";
import { assertPresent } from "@/utils/assertions";
import { useEditSpaceMembersPermissions, useRemoveGroupMember } from "@/models/spaces";

import Avatar from "@/components/Avatar";

export function Page() {
  const { space } = useLoadedData();

  return (
    <Pages.Page title={space.name!} testId="space-access-management-page">
      <Paper.Root>
        <Navigation space={space} />

        <Paper.Body>
          <Title />
          <GeneralAccess />
          <SpaceManagers />
          <SpaceMembers />
          <OtherPeople />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title() {
  const { space } = useLoadedData();
  const addMembersPath = Paths.spaceAddMembersPath(space.id!);

  assertPresent(space.permissions, "Space permissions must be present");

  return (
    <div className="rounded-t-[20px]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold ">Team &amp; Access</div>
          <div className="text-medium">Manage the team and access to this space</div>
        </div>

        {space.permissions.canAddMembers && (
          <PrimaryButton size="sm" linkTo={addMembersPath} testId="add-members">
            Add Members
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

function Navigation({ space }: { space: Space }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spacePath(space.id!)}>{space.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}

function GeneralAccess() {
  const { space } = useLoadedData();
  const editPath = Paths.spaceEditGeneralAccessPath(space.id!);

  assertPresent(space.accessLevels, "Space access levels must be present");
  assertPresent(space.permissions, "Space permissions must be present");

  return (
    <Paper.Section title="General Access">
      <BorderedRow>
        <AccessLevel anonymous={space.accessLevels.public!} company={space.accessLevels.company!} tense="present" />

        {space.permissions.canAddMembers && (
          <SecondaryButton linkTo={editPath} size="xs">
            Edit
          </SecondaryButton>
        )}
      </BorderedRow>
    </Paper.Section>
  );
}

function SpaceManagers() {
  const { space } = useLoadedData();

  assertPresent(space.members, "Space members must be present");

  const subtitle = "Managers have full access to resources in this space, including team and access management.";
  const managers = space.members.filter((member) => member.accessLevel === PermissionLevels.FULL_ACCESS);

  if (managers.length === 0) return null;

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

  const members = space.members.filter((member) => member.accessLevel !== PermissionLevels.FULL_ACCESS);

  if (members.length === 0) return null;

  return (
    <Paper.Section title="Members">
      {members.map((contrib) => (
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
        <SpaceAccessLevelBadge accessLevel={member.accessLevel!} />
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
  const { space } = useLoadedData();

  const editPerms = space.permissions!.canEditMembersPermissions!;
  const isManager = member.accessLevel === PermissionLevels.FULL_ACCESS;

  if (!editPerms) return null;

  return (
    <Menu testId={createTestId("member-menu", member!.fullName!)} size="medium">
      <PromoteToManagerMenuItem member={member} hidden={!editPerms} />
      <DemoteToMemberMenuItem member={member} hidden={!editPerms} />
      <ChangeAccessLevelMenuItem member={member} hidden={!editPerms || isManager} />
      <RemoveMemberMenuItem member={member} hidden={!editPerms} />
    </Menu>
  );
}

function PromoteToManagerMenuItem({ member, hidden }: { member: People.Person; hidden: boolean }) {
  const { space } = useLoadedData();
  const refresh = Pages.useRefresh();
  const [edit] = useEditSpaceMembersPermissions();

  if (member.accessLevel === PermissionLevels.FULL_ACCESS) return null;

  const handleClick = async () => {
    await edit({ spaceId: space.id, members: [{ id: member.id, accessLevel: PermissionLevels.FULL_ACCESS }] });
    refresh();
  };

  return (
    <MenuActionItem onClick={handleClick} testId="promote-to-manager" hidden={hidden}>
      Promote to manager
    </MenuActionItem>
  );
}

function DemoteToMemberMenuItem({ member, hidden }: { member: People.Person; hidden: boolean }) {
  const { space } = useLoadedData();
  const refresh = Pages.useRefresh();
  const [edit] = useEditSpaceMembersPermissions();

  if (member.accessLevel !== PermissionLevels.FULL_ACCESS) return null;

  const handleClick = async () => {
    await edit({ spaceId: space.id, members: [{ id: member.id, accessLevel: PermissionLevels.EDIT_ACCESS }] });
    refresh();
  };

  return (
    <MenuActionItem onClick={handleClick} testId="demote-to-member" hidden={hidden}>
      Reassign to member
    </MenuActionItem>
  );
}

function RemoveMemberMenuItem({ member, hidden }: { member: People.Person; hidden: boolean }) {
  const { space } = useLoadedData();
  const refresh = Pages.useRefresh();
  const [remove] = useRemoveGroupMember();

  const handleClick = async () => {
    await remove({ groupId: space.id, memberId: member.id });
    refresh();
  };

  return (
    <MenuActionItem danger={true} onClick={handleClick} testId="remove-member" hidden={hidden}>
      Remove from space
    </MenuActionItem>
  );
}

function ChangeAccessLevelMenuItem({ member, hidden }: { member: People.Person; hidden: boolean }) {
  const { space } = useLoadedData();
  const refresh = Pages.useRefresh();
  const [edit] = useEditSpaceMembersPermissions();

  const handleClick = async (accessLevel: number) => {
    await edit({ spaceId: space.id, members: [{ id: member.id, accessLevel }] });
    refresh();
  };

  return (
    <SubMenu label="Change access level" hidden={hidden}>
      <MenuActionItem testId="edit-access" onClick={() => handleClick(PermissionLevels.EDIT_ACCESS)}>
        Edit access
      </MenuActionItem>
      <MenuActionItem testId="comment-access" onClick={() => handleClick(PermissionLevels.COMMENT_ACCESS)}>
        Comment access
      </MenuActionItem>
      <MenuActionItem testId="view-access" onClick={() => handleClick(PermissionLevels.VIEW_ACCESS)}>
        View access
      </MenuActionItem>
    </SubMenu>
  );
}
