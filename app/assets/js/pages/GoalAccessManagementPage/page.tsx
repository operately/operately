import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";

import Api from "@/api";
import { GoalAccessLevelBadge } from "@/components/Badges/AccessLevelBadges";
import { AccessLevel } from "@/features/goals/AccessLevel";
import { BorderedRow } from "@/components/BorderedRow";
import { PermissionLevels } from "@/features/Permissions";
import { createTestId } from "@/utils/testid";
import { compareIds, usePaths } from "@/routes/paths";
import { Menu, MenuActionItem, PrimaryButton, SecondaryButton, SubMenu } from "turboui";
import { Avatar } from "turboui";
import { OtherPeople } from "./OtherPeople";
import { useLoadedData } from "./loader";

export function Page() {
  const { goal } = useLoadedData();
  const goalName = goal.name ?? "Goal";

  return (
    <Pages.Page title={["Team & Access", goalName]} testId="goal-access-management-page">
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
  const { goal } = useLoadedData();
  const paths = usePaths();

  const items: Paper.NavigationItem[] = [];

  if (goal.space) {
    items.push({ to: paths.spacePath(goal.space.id), label: goal.space.name });
    items.push({ to: paths.spaceWorkMapPath(goal.space.id), label: "Work Map" });
  } else {
    items.push({ to: paths.workMapPath("goals"), label: "Work Map" })
  }
  items.push({ to: paths.goalPath(goal.id), label: goal.name });

  return <Paper.Navigation items={items} />;
}

function Title() {
  const paths = usePaths();
  const { goal } = useLoadedData();

  const canEdit = goal.permissions?.canEdit ?? false;
  const addPath = paths.goalAccessAddPath(goal.id);

  return (
    <div className="rounded-t-[20px]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold">Team &amp; Access</div>
          <div className="text-medium">Manage the team and access to this goal</div>
        </div>

        {canEdit && (
          <PrimaryButton linkTo={addPath} testId="add-goal-access" size="sm">
            Add People
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

function GeneralAccess() {
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
    <Paper.Section title="General Access">
      <BorderedRow>
        <AccessLevel
          anonymous={accessLevels.public ?? PermissionLevels.NO_ACCESS}
          company={accessLevels.company ?? PermissionLevels.NO_ACCESS}
          space={accessLevels.space ?? PermissionLevels.NO_ACCESS}
          tense="present"
        />

        {canEdit && (
          <SecondaryButton linkTo={editPath} size="xs">
            Edit
          </SecondaryButton>
        )}
      </BorderedRow>
    </Paper.Section>
  );
}

function AccessMembers() {
  const { accessMembers } = useLoadedData();

  if (accessMembers.length === 0) return null;

  return (
    <Paper.Section title="People with Direct Access">
      {accessMembers.map((member) => (
        <AccessMemberRow key={member.id} member={member} />
      ))}
    </Paper.Section>
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
  const memberName = member.fullName ?? "Unknown";
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
  const { goal } = useLoadedData();
  const refresh = Pages.useRefresh();
  const [update] = Api.goals.useUpdateAccessMember();
  const [remove] = Api.goals.useRemoveAccessMember();

  const canEdit = goal.permissions?.canEdit ?? false;
  if (!canEdit || role) return null;
  if (!member.id) return null;

  const handleUpdate = async (accessLevel: number) => {
    await update({ goalId: goal.id, personId: member.id, accessLevel });
    refresh();
  };

  const handleRemove = async () => {
    await remove({ goalId: goal.id, personId: member.id });
    refresh();
  };

  const menuLabel = member.fullName ?? member.id ?? "member";

  return (
    <Menu testId={createTestId("goal-access-menu", menuLabel)} size="medium">
      <ChangeAccessLevelMenuItem onChange={handleUpdate} />
      <MenuActionItem danger={true} onClick={handleRemove} testId="remove-goal-access">
        Remove from goal
      </MenuActionItem>
    </Menu>
  );
}

function ChangeAccessLevelMenuItem({ onChange }: { onChange: (accessLevel: number) => void }) {
  return (
    <SubMenu label="Change access level">
      <MenuActionItem testId="full-access" onClick={() => onChange(PermissionLevels.FULL_ACCESS)}>
        Full access
      </MenuActionItem>
      <MenuActionItem testId="edit-access" onClick={() => onChange(PermissionLevels.EDIT_ACCESS)}>
        Edit access
      </MenuActionItem>
      <MenuActionItem testId="comment-access" onClick={() => onChange(PermissionLevels.COMMENT_ACCESS)}>
        Comment access
      </MenuActionItem>
      <MenuActionItem testId="view-access" onClick={() => onChange(PermissionLevels.VIEW_ACCESS)}>
        View access
      </MenuActionItem>
    </SubMenu>
  );
}

function useMemberRole(member: People.Person): string | null {
  const { goal } = useLoadedData();

  if (goal.champion && compareIds(goal.champion.id, member.id)) return "Champion";
  if (goal.reviewer && compareIds(goal.reviewer.id, member.id)) return "Reviewer";

  return null;
}
