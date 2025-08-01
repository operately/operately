import React, { useState } from "react";
import { ActionList } from "../ActionList";
import { SecondaryButton } from "../Button";
import { DateField } from "../DateField";
import { GoalField } from "../GoalField";
import {
  IconCircleArrowRight,
  IconCircleCheck,
  IconCopy,
  IconInfoCircle,
  IconPlayerPause,
  IconRotateDot,
  IconTrash,
} from "../icons";
import { LastCheckIn } from "../LastCheckIn";
import { NotificationToggle } from "../NotificationToggle";
import { PersonField } from "../PersonField";
import { Tooltip } from "../Tooltip";
import { ProjectPage } from ".";

export function OverviewSidebar(props: any) {
  return (
    <div className="sm:col-span-4 sm:pl-8">
      <div className="space-y-6">
        <LastCheckInSection {...props} />
        <ParentGoal {...props} />
        <ProjectDates {...props} />
      </div>

      <div className="space-y-6 pt-6 mt-6 border-t border-surface-outline">
        <Champion {...props} />
        <Reviewer {...props} />
        <Contributors {...props} />
      </div>

      <div className="pt-6 mt-6 border-t border-surface-outline">
        <NotificationSection {...props} />
      </div>

      <div className="pt-6 mt-6 border-t border-surface-outline">
        <Actions {...props} />
      </div>
    </div>
  );
}

function LastCheckInSection(props: any) {
  if (!props.checkIns || props.checkIns.length === 0) {
    return null;
  }

  return (
    <SidebarSection title="Last check-in">
      <LastCheckIn checkIns={props.checkIns} state={props.state} mentionedPersonLookup={props.mentionedPersonLookup} />
    </SidebarSection>
  );
}

function ParentGoal(props: any) {
  return (
    <SidebarSection title="Parent goal">
      <GoalField
        testId="parent-goal-field"
        goal={props.parentGoal || null}
        setGoal={props.setParentGoal || (() => {})}
        searchGoals={props.parentGoalSearch || (async () => [])}
        readonly={!props.canEdit}
        emptyStateMessage="Set parent goal"
        emptyStateReadOnlyMessage="No parent goal"
      />
    </SidebarSection>
  );
}

function ProjectDates(props: ProjectPage.State) {
  return (
    <div className="space-y-4">
      <SidebarSection title="Start date">
        <DateField
          date={props.startedAt || null}
          onDateSelect={props.setStartedAt || (() => {})}
          readonly={!props.canEdit}
          placeholder="Set start date"
          showOverdueWarning={false}
          useStartOfPeriod={true}
        />
      </SidebarSection>
      <SidebarSection title="Due date">
        <DateField
          date={props.dueAt || null}
          onDateSelect={props.setDueAt || (() => {})}
          readonly={!props.canEdit}
          placeholder="Set due date"
        />
      </SidebarSection>
    </div>
  );
}

function Champion(props: ProjectPage.State) {
  return (
    <SidebarSection
      title={
        <div className="flex items-center gap-2">
          <span>Champion</span>
          <Tooltip
            content={
              <div className="max-w-xs">
                <div className="font-semibold mb-2">Project champion</div>
                <div className="text-sm">
                  The project owner accountable for completion. Plans, assigns responsibilities, and submits weekly
                  check-ins.
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
      />
    </SidebarSection>
  );
}

function Reviewer(props: ProjectPage.State) {
  return (
    <SidebarSection
      title={
        <div className="flex items-center gap-2">
          <span>Reviewer</span>
          <Tooltip
            content={
              <div className="max-w-xs">
                <div className="font-semibold mb-2">Project reviewer</div>
                <div className="text-sm">
                  Provides feedback throughout the project, and is responsible for acknowledging weekly check-ins.
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
        person={props.reviewer || null}
        setPerson={props.setReviewer || (() => {})}
        readonly={!props.canEdit}
        searchPeople={props.reviewerSearch}
        emptyStateMessage="Set reviewer"
        emptyStateReadOnlyMessage="No reviewer"
      />
    </SidebarSection>
  );
}

function Contributors(props: any) {
  const contributors = props.contributors || [];

  return (
    <SidebarSection title="Contributors">
      <div className="space-y-3">
        {contributors.length > 0 ? (
          contributors.map((person: any) => (
            <PersonField
              key={person.id}
              person={person}
              setPerson={() => {}}
              readonly={true}
              searchPeople={async () => []}
              showTitle={true}
            />
          ))
        ) : (
          <div className="text-sm text-content-dimmed">No contributors</div>
        )}
        {props.canEdit && (
          <div className="mt-3">
            <SecondaryButton linkTo={props.manageTeamLink} size="xs">
              Manage team & access
            </SecondaryButton>
          </div>
        )}
      </div>
    </SidebarSection>
  );
}

function NotificationSection(_props: any) {
  const [isSubscribed, setIsSubscribed] = useState(true);

  const handleToggle = (subscribed: boolean) => {
    setIsSubscribed(subscribed);
  };

  return (
    <SidebarSection title="Notifications">
      <NotificationToggle isSubscribed={isSubscribed} onToggle={handleToggle} entityType="project" />
    </SidebarSection>
  );
}

function Actions(props: any) {
  const actions = [
    {
      type: "action" as const,
      label: "Copy URL",
      onClick: () => navigator.clipboard?.writeText(window.location.href),
      icon: IconCopy,
    },
    {
      type: "action" as const,
      label: "Move to another space",
      onClick: () => console.log("Move to another space"),
      icon: IconCircleArrowRight,
      hidden: !props.canEdit,
    },
    {
      type: "action" as const,
      label: "Pause project",
      onClick: () => console.log("Pause project"),
      icon: IconPlayerPause,
      hidden: !props.canEdit || props.state === "closed",
    },
    {
      type: "link" as const,
      label: "Close project",
      link: props.closeLink,
      icon: IconCircleCheck,
      hidden: !props.canEdit || props.state === "closed",
    },
    {
      type: "link" as const,
      label: "Re-open project",
      link: props.reopenLink,
      icon: IconRotateDot,
      hidden: !props.canEdit || props.state !== "closed",
    },
    {
      type: "action" as const,
      label: "Delete",
      onClick: () => console.log("Delete project"),
      icon: IconTrash,
      hidden: !props.canEdit,
      danger: true,
    },
  ];

  const visibleActions = actions.filter((action) => !action.hidden);
  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <SidebarSection title="Actions">
      <ActionList actions={visibleActions} />
    </SidebarSection>
  );
}

function SidebarSection({ title, children }: { title: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-bold text-sm mb-1.5">{title}</div>
      {children}
    </div>
  );
}
