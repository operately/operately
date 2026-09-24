import React from "react";
import { useTranslation } from "react-i18next";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";

import { SpaceAccessLevelBadge } from "@/components/Badges/AccessLevelBadges";
import { PermissionLevels } from "@/features/Permissions";
import { AccessOptionsInt } from "@/models/permissions";
import { Space } from "@/models/spaces";
import { usePaths } from "@/routes/paths";
import {
  AccessLevelSummary,
  Avatar,
  BorderedRow,
  Menu,
  MenuActionItem,
  PageSection,
  PrimaryButton,
  SecondaryButton,
  SubMenu,
} from "turboui";
import { OtherPeople } from "./OtherPeople";

import { useEditSpaceMembersPermissions, useRemoveGroupMember } from "@/models/spaces";
import { createTestId } from "@/utils/testid";
import { useLoadedData } from "./loader";

export function Page() {
  const { space } = useLoadedData();

  return (
    <Pages.Page title={space.name} testId="space-access-management-page">
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
  const { t } = useTranslation();
  const { space } = useLoadedData();
  const paths = usePaths();
  const addMembersPath = paths.spaceAddMembersPath(space.id);

  return (
    <div className="rounded-t-[20px]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold ">{t("Team & Access")}</div>
          <div className="text-medium">{t("Manage the team and access to this space")}</div>
        </div>

        {space.permissions.hasFullAccess && (
          <PrimaryButton size="sm" linkTo={addMembersPath} testId="add-members">
            {t("Add Members")}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

function Navigation({ space }: { space: Space }) {
  const paths = usePaths();
  return <Paper.Navigation items={[{ to: paths.spacePath(space.id), label: space.name }]} />;
}

function GeneralAccess() {
  const { t } = useTranslation();
  const { space } = useLoadedData();
  const paths = usePaths();
  const editPath = paths.spaceEditGeneralAccessPath(space.id);

  return (
    <PageSection title={t("General Access")}>
      <BorderedRow>
        <AccessLevelSummary
          resourceType="space"
          tense="present"
          anonymous={space.accessLevels.public ?? 0}
          company={space.accessLevels.company ?? 0}
        />

        {space.permissions.hasFullAccess && (
          <SecondaryButton linkTo={editPath} size="xs">
            {t("Edit")}
          </SecondaryButton>
        )}
      </BorderedRow>
    </PageSection>
  );
}

function SpaceManagers() {
  const { t } = useTranslation();
  const { space } = useLoadedData();

  const subtitle = t("Managers have full access to resources in this space, including team and access management.");
  const managers = space.members.filter((member) => member.accessLevel === PermissionLevels.FULL_ACCESS);

  if (managers.length === 0) return null;

  return (
    <PageSection title={t("Space Managers")} subtitle={subtitle}>
      {managers.map((contrib) => (
        <Member member={contrib} key={contrib.id} />
      ))}
    </PageSection>
  );
}

function SpaceMembers() {
  const { t } = useTranslation();
  const { space } = useLoadedData();

  const members = space.members.filter((member) => member.accessLevel !== PermissionLevels.FULL_ACCESS);

  if (members.length === 0) return null;

  return (
    <PageSection title={t("Members")}>
      {members.map((contrib) => (
        <Member member={contrib} key={contrib.id} />
      ))}
    </PageSection>
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
        <SpaceAccessLevelBadge accessLevel={member.accessLevel ?? null} />
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

  const editPerms = space.permissions?.hasFullAccess;
  const isManager = member.accessLevel === PermissionLevels.FULL_ACCESS;

  if (!editPerms) return null;

  return (
    <Menu testId={createTestId("member-menu", member.fullName)} size="medium">
      <PromoteToManagerMenuItem member={member} hidden={!editPerms} />
      <DemoteToMemberMenuItem member={member} hidden={!editPerms} />
      <ChangeAccessLevelMenuItem member={member} hidden={!editPerms || isManager} />
      <RemoveMemberMenuItem member={member} hidden={!editPerms} />
    </Menu>
  );
}

function PromoteToManagerMenuItem({ member, hidden }: { member: People.Person; hidden: boolean }) {
  const { t } = useTranslation();
  const { space } = useLoadedData();
  const { mutateAsync: edit } = useEditSpaceMembersPermissions();

  if (member.accessLevel === PermissionLevels.FULL_ACCESS) return null;

  const handleClick = async () => {
    await edit({ spaceId: space.id, members: [{ id: member.id, accessLevel: PermissionLevels.FULL_ACCESS }] });
  };

  return (
    <MenuActionItem onClick={handleClick} testId="promote-to-manager" hidden={hidden}>
      {t("Promote to manager")}
    </MenuActionItem>
  );
}

function DemoteToMemberMenuItem({ member, hidden }: { member: People.Person; hidden: boolean }) {
  const { t } = useTranslation();
  const { space } = useLoadedData();
  const { mutateAsync: edit } = useEditSpaceMembersPermissions();

  if (member.accessLevel !== PermissionLevels.FULL_ACCESS) return null;

  const handleClick = async () => {
    await edit({ spaceId: space.id, members: [{ id: member.id, accessLevel: PermissionLevels.EDIT_ACCESS }] });
  };

  return (
    <MenuActionItem onClick={handleClick} testId="demote-to-member" hidden={hidden}>
      {t("Reassign to member")}
    </MenuActionItem>
  );
}

function RemoveMemberMenuItem({ member, hidden }: { member: People.Person; hidden: boolean }) {
  const { t } = useTranslation();
  const { space } = useLoadedData();
  const { mutateAsync: remove } = useRemoveGroupMember();

  const handleClick = async () => {
    await remove({ spaceId: space.id, memberId: member.id });
  };

  return (
    <MenuActionItem danger={true} onClick={handleClick} testId="remove-member" hidden={hidden}>
      {t("Remove from space")}
    </MenuActionItem>
  );
}

function ChangeAccessLevelMenuItem({ member, hidden }: { member: People.Person; hidden: boolean }) {
  const { t } = useTranslation();
  const { space } = useLoadedData();
  const { mutateAsync: edit } = useEditSpaceMembersPermissions();

  const handleClick = async (accessLevel: AccessOptionsInt) => {
    await edit({ spaceId: space.id, members: [{ id: member.id, accessLevel }] });
  };

  return (
    <SubMenu label={t("Change access level")} hidden={hidden}>
      <MenuActionItem testId="edit-access" onClick={() => handleClick(PermissionLevels.EDIT_ACCESS)}>
        {t("Edit access")}
      </MenuActionItem>
      <MenuActionItem testId="comment-access" onClick={() => handleClick(PermissionLevels.COMMENT_ACCESS)}>
        {t("Comment access")}
      </MenuActionItem>
      <MenuActionItem testId="view-access" onClick={() => handleClick(PermissionLevels.VIEW_ACCESS)}>
        {t("View access")}
      </MenuActionItem>
    </SubMenu>
  );
}
