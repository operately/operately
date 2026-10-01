import { Trans } from "turboui";
import { useTranslation } from "react-i18next";
import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import { AccessOptionsInt } from "@/models/permissions";

import * as Goals from "@/models/goals";
import { GoalAccessLevelBadge } from "@/components/Badges/AccessLevelBadges";
import { PermissionLevels } from "@/features/Permissions";
import { createTestId } from "@/utils/testid";
import { compareIds, usePaths } from "@/routes/paths";
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
import { useLoadedData } from "./loader";

export function Page() {
  const { t } = useTranslation();
  const { goal } = useLoadedData();
  const goalName = goal.name ?? t("Goal");

  return (
    <Pages.Page title={[t("Team & Access"), goalName]} testId="goal-access-management-page">
      <Paper.Root>
        <Navigation />

        <Paper.Body>
          <Title />
          <GeneralAccess />
          <AccessMembers />
          <OtherPeople />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  const { t } = useTranslation();
  const { goal } = useLoadedData();
  const paths = usePaths();

  const items: Paper.NavigationItem[] = [];

  if (goal.space) {
    items.push({ to: paths.spacePath(goal.space.id), label: goal.space.name });
    items.push({ to: paths.spaceWorkMapPath(goal.space.id), label: t("Work Map") });
  } else {
    items.push({ to: paths.workMapPath("goals"), label: t("Work Map") });
  }
  items.push({ to: paths.goalPath(goal.id), label: goal.name });

  return <Paper.Navigation items={items} />;
}

function Title() {
  const { t } = useTranslation();
  const paths = usePaths();
  const { goal } = useLoadedData();

  const canEdit = goal.permissions?.hasFullAccess ?? false;
  const addPath = paths.goalAccessAddPath(goal.id);

  return (
    <div className="rounded-t-[20px]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold">
            <Trans i18nKey="Team & Access" />
          </div>
          <div className="text-medium">{t("Manage the team and access to this goal")}</div>
        </div>

        {canEdit && (
          <PrimaryButton linkTo={addPath} testId="add-goal-access" size="sm">
            {t("Add People")}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

function GeneralAccess() {
  const { t } = useTranslation();
  const paths = usePaths();
  const { goal } = useLoadedData();
  const editPath = paths.goalEditPermissionsPath(goal.id);

  const accessLevels = goal.accessLevels || {
    public: PermissionLevels.NO_ACCESS,
    company: PermissionLevels.NO_ACCESS,
    space: PermissionLevels.NO_ACCESS,
  };

  const canEdit = goal.permissions?.canEdit ?? false;

  return (
    <PageSection title={t("General Access")}>
      <BorderedRow>
        <AccessLevelSummary
          resourceType="goal"
          tense="present"
          anonymous={accessLevels.public ?? PermissionLevels.NO_ACCESS}
          company={accessLevels.company ?? PermissionLevels.NO_ACCESS}
          space={accessLevels.space ?? PermissionLevels.NO_ACCESS}
        />

        {canEdit && (
          <SecondaryButton linkTo={editPath} size="xs">
            {t("Edit")}
          </SecondaryButton>
        )}
      </BorderedRow>
    </PageSection>
  );
}

function AccessMembers() {
  const { t } = useTranslation();
  const { accessMembers } = useLoadedData();

  if (accessMembers.length === 0) return null;

  return (
    <PageSection title={t("People with Direct Access")}>
      {accessMembers.map((member) => (
        <AccessMemberRow key={member.id} member={member} />
      ))}
    </PageSection>
  );
}

function AccessMemberRow({ member }: { member: People.Person }) {
  const role = useMemberRole(member);
  const accessLevel = member.accessLevel ?? PermissionLevels.VIEW_ACCESS;

  return (
    <BorderedRow>
      <div className="flex items-center gap-2">
        <Avatar person={member} size={40} />
        <MemberName member={member} role={role} />
      </div>
      <div className="flex items-center gap-4">
        <GoalAccessLevelBadge accessLevel={accessLevel} />
        <MemberMenu member={member} role={role} />
      </div>
    </BorderedRow>
  );
}

function MemberName({ member, role }: { member: People.Person; role: string | null }) {
  const { t } = useTranslation();
  const memberName = member.fullName ?? t("Unknown");
  const title = member.title ?? "";

  return (
    <div className="flex flex-col flex-1">
      <div className="font-bold flex items-center gap-2">
        {memberName}
        {role && <span className="text-xs uppercase text-content-dimmed">{role}</span>}
      </div>
      <div className="text-sm font-medium flex items-center">{title}</div>
    </div>
  );
}

function MemberMenu({ member, role }: { member: People.Person; role: string | null }) {
  const { t } = useTranslation();
  const { goal } = useLoadedData();
  const update = Goals.useUpdateGoalAccessMember();
  const remove = Goals.useDeleteGoalAccessMember();

  const canEdit = goal.permissions?.canEdit ?? false;
  if (!canEdit || role) return null;
  const personId = member.id;
  if (!personId) return null;

  const handleUpdate = async (accessLevel: AccessOptionsInt) => {
    await update.mutateAsync({ goalId: goal.id, personId, accessLevel });
  };

  const handleRemove = async () => {
    await remove.mutateAsync({ goalId: goal.id, personId });
  };

  const menuLabel = member.fullName ?? member.id ?? "member";

  return (
    <Menu testId={createTestId("goal-access-menu", menuLabel)} size="medium">
      <ChangeAccessLevelMenuItem onChange={handleUpdate} />
      <MenuActionItem danger={true} onClick={handleRemove} testId="remove-goal-access">
        {t("Remove from goal")}
      </MenuActionItem>
    </Menu>
  );
}

function ChangeAccessLevelMenuItem({ onChange }: { onChange: (accessLevel: number) => void }) {
  const { t } = useTranslation();
  return (
    <SubMenu label={t("Change access level")}>
      <MenuActionItem testId="full-access" onClick={() => onChange(PermissionLevels.FULL_ACCESS)}>
        {t("Full access")}
      </MenuActionItem>
      <MenuActionItem testId="edit-access" onClick={() => onChange(PermissionLevels.EDIT_ACCESS)}>
        {t("Edit access")}
      </MenuActionItem>
      <MenuActionItem testId="comment-access" onClick={() => onChange(PermissionLevels.COMMENT_ACCESS)}>
        {t("Comment access")}
      </MenuActionItem>
      <MenuActionItem testId="view-access" onClick={() => onChange(PermissionLevels.VIEW_ACCESS)}>
        {t("View access")}
      </MenuActionItem>
    </SubMenu>
  );
}

function useMemberRole(member: People.Person): string | null {
  const { t } = useTranslation();
  const { goal } = useLoadedData();

  if (goal.champion && compareIds(goal.champion.id, member.id)) return t("Champion");
  if (goal.reviewer && compareIds(goal.reviewer.id, member.id)) return t("Reviewer");

  return null;
}
