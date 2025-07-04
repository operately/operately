import React from "react";
import classNames from "../utils/classnames";

import { match } from "ts-pattern";
import { GoalPage } from ".";
import { ActionList } from "../ActionList";
import { Avatar } from "../Avatar";
import { DateField } from "../DateField";
import { GoalField } from "../GoalField";
import { LastCheckIn } from "../LastCheckIn";
import { DivLink } from "../Link";
import { PersonField } from "../PersonField";
import { PrivacyField } from "../PrivacyField";
import { Summary } from "../RichContent";
import { StatusBadge } from "../StatusBadge";
import { WarningCallout } from "../Callouts";
import { durationHumanized, isOverdue } from "../utils/time";
import { Tooltip } from "../Tooltip";

import {
  IconCircleArrowRight,
  IconCircleCheck,
  IconRotateDot,
  IconTrash,
  IconUserCheck,
  IconUserStar,
  IconInfoCircle,
} from "../icons";

export function Sidebar(props: GoalPage.State) {
  return (
    <div className="sm:col-span-4 space-y-6 hidden sm:block sm:pl-8">
      <Retrospective {...props} />
      <CompletedOn {...props} />
      <LastCheckInSection {...props} />
      <ParentGoal {...props} />
      <DueDate {...props} />
      <Champion {...props} />
      <Reviewer {...props} />
      <Privacy {...props} />
      <Actions {...props} />
    </div>
  );
}

function DueDate(props: GoalPage.State) {
  const isReadonly = !props.canEdit || !!props.closedAt;

  return (
    <SidebarSection title="Due Date">
      <DateField
        date={props.dueDate}
        setDate={props.setDueDate}
        readonly={isReadonly}
        showOverdueWarning={!props.closedAt}
        testId="due-date-field"
      />

      <OverdueWarning {...props} />
    </SidebarSection>
  );
}

function CompletedOn(props: GoalPage.State) {
  if (!props.closedAt) return null;

  return (
    <SidebarSection title="Completed On">
      <DateField date={props.closedAt} readonly showOverdueWarning={false} />
    </SidebarSection>
  );
}

function ParentGoal(props: GoalPage.State) {
  return (
    <SidebarSection title="Parent Goal">
      <GoalField
        testId="parent-goal-field"
        goal={props.parentGoal}
        setGoal={props.setParentGoal}
        searchGoals={props.parentGoalSearch}
        emptyStateMessage="No parent goal"
        emptyStateReadOnlyMessage="No parent goal"
      />
    </SidebarSection>
  );
}

function Champion(props: GoalPage.State) {
  return (
    <SidebarSection
      title={
        <div className="flex items-center gap-2">
          <span>Champion</span>
          <Tooltip
            content={
              <div className="max-w-xs">
                <div className="font-semibold mb-2">Goal Champion</div>
                <div className="text-sm">
                  The goal owner accountable for completion. Plans projects and submits monthly check-ins.
                </div>
              </div>
            }
          >
            <IconInfoCircle className="w-4 h-4 text-content-dimmed cursor-help" />
          </Tooltip>
        </div>
      }
    >
      <PersonField
        testId="champion-field"
        person={props.champion}
        setPerson={props.setChampion}
        readonly={!props.canEdit}
        searchPeople={props.championSearch}
        emptyStateMessage="Set champion"
        emptyStateReadOnlyMessage="No champion"
        extraDialogMenuOptions={[
          {
            label: "Assign as reviewer",
            onClick: () => {
              props.setReviewer(props.champion!);
              props.setChampion(null);
            },
            icon: IconUserCheck,
          },
        ]}
      />
    </SidebarSection>
  );
}

function Reviewer(props: GoalPage.State) {
  return (
    <SidebarSection
      title={
        <div className="flex items-center gap-2">
          <span>Reviewer</span>
          <Tooltip
            content={
              <div className="max-w-xs">
                <div className="font-semibold mb-2">Goal Reviewer</div>
                <div className="text-sm">
                  Provides feedback throughout the goal, and is responsible for acknowledging monthly check-ins.
                </div>
              </div>
            }
          >
            <IconInfoCircle className="w-4 h-4 text-content-dimmed cursor-help" />
          </Tooltip>
        </div>
      }
    >
      <PersonField
        testId="reviewer-field"
        person={props.reviewer}
        setPerson={props.setReviewer}
        readonly={!props.canEdit}
        searchPeople={props.reviewerSearch}
        emptyStateMessage="Set reviewer"
        emptyStateReadOnlyMessage="No reviewer"
        extraDialogMenuOptions={[
          {
            label: "Assign as champion",
            onClick: () => {
              props.setReviewer(null);
              props.setChampion(props.reviewer!);
            },
            icon: IconUserStar,
          },
        ]}
      />
    </SidebarSection>
  );
}

function LastCheckInSection(props: GoalPage.State) {
  if (props.checkIns.length === 0) return null;

  return (
    <SidebarSection title="Last Check-In">
      <LastCheckIn checkIns={props.checkIns} state={props.state} mentionedPersonLookup={props.mentionedPersonLookup} />
    </SidebarSection>
  );
}

function Retrospective(props: GoalPage.Props) {
  if (props.state !== "closed") return null;
  if (!props.retrospective) return null;

  const retro = props.retrospective;

  const borderColor = match(props.status)
    .with("achieved", () => "border-green-500")
    .with("missed", () => "border-red-500")
    .with("dropped", () => "border-gray-500")
    .with("partial", () => "border-yellow-500")
    .run();

  const className = classNames(
    "flex gap-1 flex-col",
    "cursor-pointer text-sm py-3 pl-3 pr-4",
    "border-l-4",
    "bg-zinc-50 dark:bg-zinc-800",
    "hover:bg-zinc-100 dark:hover:bg-zinc-700",
    borderColor,
  );

  return (
    <div className="text-sm">
      <DivLink to={retro.link} className={className}>
        <div className="flex items-center font-semibold">Goal Retrospective</div>

        <Summary content={retro.content} characterCount={130} mentionedPersonLookup={props.mentionedPersonLookup} />

        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Avatar person={retro.author} size={20} />
            {retro.author.fullName.split(" ")[0]}
          </div>
          <StatusBadge status={props.status} hideIcon className="scale-95 inline-block shrink-0 align-[5px]" />
        </div>
      </DivLink>
    </div>
  );
}

function OverdueWarning(props: GoalPage.State) {
  if (props.state === "closed") return null;
  if (!props.dueDate) return null;
  if (!isOverdue(props.dueDate)) return null;

  const duration = durationHumanized(props.dueDate, new Date());

  return (
    <div className="mt-2">
      <WarningCallout message={`Overdue by ${duration}.`} />
    </div>
  );
}

function SidebarSection({ title, children }: { title: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="">
      <div className="font-bold text-sm mb-1.5">{title}</div>
      {children}
    </div>
  );
}

function Privacy(props: GoalPage.State) {
  return (
    <SidebarSection title="Privacy">
      <PrivacyField
        testId="goal-privacy-field"
        accessLevels={props.accessLevels}
        setAccessLevels={props.setAccessLevels}
        resourceType={"goal"}
        readonly={!props.canEdit}
      />
    </SidebarSection>
  );
}

function Actions(props: GoalPage.State) {
  const actions = [
    {
      type: "link" as const,
      label: "Close Goal",
      link: props.closeLink,
      icon: IconCircleCheck,
      hidden: !props.canEdit || props.state === "closed",
      testId: "close-goal",
    },
    {
      type: "link" as const,
      label: "Re-open Goal",
      link: props.reopenLink,
      icon: IconRotateDot,
      hidden: !props.canEdit || props.state !== "closed",
      testId: "reopen-goal",
    },
    {
      type: "action" as const,
      label: "Move to another space",
      onClick: props.openMoveModal,
      icon: IconCircleArrowRight,
      hidden: !props.canEdit,
      testId: "move-to-another-space",
    },
    {
      type: "action" as const,
      label: "Delete",
      onClick: props.openDeleteModal,
      icon: IconTrash,
      hidden: !props.canEdit,
      danger: true,
      testId: "delete-goal",
    },
  ];

  const visibleCount = actions.filter((action) => !action.hidden).length;
  if (visibleCount === 0) {
    return null;
  }

  return (
    <div className="border-t pt-4">
      <ActionList actions={actions} />
    </div>
  );
}
