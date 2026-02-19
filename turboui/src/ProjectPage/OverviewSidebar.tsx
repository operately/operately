import React from "react";
import { ActionList } from "../ActionList";
import { SecondaryButton } from "../Button";
import { DateField } from "../DateField";
import { GoalField } from "../GoalField";
import {
  IconCircleArrowRight,
  IconCircleCheck,
  IconCopy,
  IconFileExport,
  IconInfoCircle,
  IconPlayerPause,
  IconRotateDot,
  IconTrash,
} from "../icons";
import { LastCheckIn } from "../LastCheckIn";
import { PersonField } from "../PersonField";
import { Tooltip } from "../Tooltip";
import { SidebarNotificationSection, SidebarSection } from "../SidebarSection";
import { ProjectPage } from ".";

export function OverviewSidebar(props: ProjectPage.State) {
  return (
    <div className="sm:col-span-4 sm:pl-8" data-test-id="overview-sidebar">
      <div className="space-y-6">
        <CheckInsSection {...props} />
        <ParentGoal {...props} />
        <ProjectDates {...props} />
      </div>

      <div className="space-y-6 pt-6 mt-6 border-t border-surface-outline">
        <Champion {...props} />
        <Reviewer {...props} />
        <Contributors {...props} />
      </div>

      <SidebarNotificationSection {...props.subscriptions} className="pt-6 mt-6 border-t border-surface-outline" />

      <div className="pt-6 mt-6 border-t border-surface-outline">
        <Actions {...props} />
      </div>
    </div>
  );
}

function CheckInsSection(props: ProjectPage.State) {
  const checkIns = props.checkIns || [];
  const isClosed = props.state === "closed";
  const lastCheckInState: "active" | "closed" | undefined = isClosed ? "closed" : "active";
  const viewerCanCheckIn = props.permissions.canCheckIn && !isClosed;
  const isChampion = !!props.currentUser?.id && !!props.champion?.id && props.currentUser.id === props.champion.id;
  const championFirstName = props.champion?.fullName?.split(" ")[0];

  let zeroStateCopy = "Weekly check-ins keep everyone in the loop. Updates will appear here.";

  if (isClosed) {
    zeroStateCopy = "This project is closed. Earlier check-ins stay available for reference.";
  } else if (viewerCanCheckIn && isChampion) {
    zeroStateCopy = "Share the first update to set the project status and start the weekly cadence.";
  } else if (championFirstName) {
    zeroStateCopy = `${championFirstName} hasn't shared a check-in yet. Updates will land here soon.`;
  }

  const header = (
    <div className="flex items-center gap-2">
      <span>Last update</span>
      {viewerCanCheckIn && (
        <span className="shrink-0">
          <SecondaryButton size="xxs" linkTo={props.newCheckInLink} testId="sidebar-check-in-button">
            Check in
          </SecondaryButton>
        </span>
      )}
    </div>
  );

  return (
    <SidebarSection title={header} className="pt-4 sm:pt-0">
      <div className="space-y-3">
        {checkIns.length > 0 ? (
          <LastCheckIn
            checkIns={checkIns}
            state={lastCheckInState}
            mentionedPersonLookup={props.richTextHandlers.mentionedPersonLookup}
          />
        ) : (
          <p className="text-sm text-content-dimmed">{zeroStateCopy}</p>
        )}
      </div>
    </SidebarSection>
  );
}

function ParentGoal(props: ProjectPage.State) {
  if (!props.parentGoal && !props.permissions.canEdit) {
    return null;
  }

  return (
    <SidebarSection title="Parent goal">
      <GoalField
        testId="parent-goal-field"
        goal={props.parentGoal}
        setGoal={props.setParentGoal}
        searchGoals={props.parentGoalSearch}
        readonly={!props.permissions.canEdit}
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
          readonly={!props.permissions.canEdit}
          placeholder="Set start date"
          showOverdueWarning={false}
          useStartOfPeriod={true}
          testId="project-start-date"
        />
      </SidebarSection>
      <SidebarSection title="Due date">
        <DateField
          date={props.dueAt || null}
          onDateSelect={props.setDueAt || (() => {})}
          readonly={!props.permissions.canEdit}
          placeholder="Set due date"
          testId="project-due-date"
          showOverdueWarning={props.state === "active"}
          showOverdueMessage={props.state === "active"}
        />
      </SidebarSection>
    </div>
  );
}

function Champion(props: ProjectPage.State) {
  const readonly = !props.permissions.hasFullAccess || !("setChampion" in props) || !("championSearch" in props);
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
      {readonly ? (
        <PersonField
          testId="champion-field"
          person={props.champion}
          readonly={true}
          emptyStateMessage="Set champion"
          emptyStateReadOnlyMessage="No champion"
        />
      ) : (
        <PersonField
          testId="champion-field"
          person={props.champion}
          setPerson={props.setChampion}
          searchData={props.championSearch}
          emptyStateMessage="Set champion"
          emptyStateReadOnlyMessage="No champion"
        />
      )}
    </SidebarSection>
  );
}

function Reviewer(props: ProjectPage.State) {
  const readonly = !props.permissions.hasFullAccess || !("setReviewer" in props) || !("reviewerSearch" in props);
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
      {readonly ? (
        <PersonField
          testId="reviewer-field"
          person={props.reviewer || null}
          readonly={true}
          emptyStateMessage="Set reviewer"
          emptyStateReadOnlyMessage="No reviewer"
        />
      ) : (
        <PersonField
          testId="reviewer-field"
          person={props.reviewer || null}
          setPerson={props.setReviewer || (() => {})}
          searchData={props.reviewerSearch}
          emptyStateMessage="Set reviewer"
          emptyStateReadOnlyMessage="No reviewer"
        />
      )}
    </SidebarSection>
  );
}

function Contributors(props: ProjectPage.State) {
  const contributors = props.contributors.filter((c) => ![props.champion?.id, props.reviewer?.id].includes(c.id));

  return (
    <SidebarSection title="Contributors">
      <div className="space-y-3">
        {contributors.length > 0 ? (
          contributors.map((person: any) => (
            <PersonField key={person.id} person={person} readonly={true} showTitle={true} />
          ))
        ) : (
          <div className="text-sm text-content-dimmed">No contributors</div>
        )}
        {props.permissions.canEdit && (
          <div className="mt-3">
            <SecondaryButton linkTo={props.manageTeamLink} size="xs" testId="manage-team-button">
              Manage team & access
            </SecondaryButton>
          </div>
        )}
      </div>
    </SidebarSection>
  );
}

function Actions(props: ProjectPage.State) {
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
      onClick: props.openMoveModal,
      icon: IconCircleArrowRight,
      hidden: !props.permissions.canEditSpace || !("space" in props),
    },
    {
      type: "link" as const,
      label: "Pause project",
      link: props.pauseLink,
      icon: IconPlayerPause,
      testId: "pause-project",
      hidden: !props.permissions.canPause || props.state === "closed" || props.state === "paused",
    },
    {
      type: "link" as const,
      label: "Close project",
      link: props.closeLink,
      icon: IconCircleCheck,
      testId: "close-project",
      hidden: !props.permissions.canClose || props.state === "closed",
    },
    {
      type: "link" as const,
      label: "Resume project",
      link: props.reopenLink,
      icon: IconRotateDot,
      hidden: !props.permissions.canResume || props.state !== "paused",
    },
    {
      type: "action" as const,
      label: "Export as Markdown",
      onClick: props.exportMarkdown,
      icon: IconFileExport,
      testId: "export-as-markdown",
      hidden: !props.exportMarkdown,
    },
    {
      type: "action" as const,
      label: "Delete",
      onClick: props.openDeleteModal,
      icon: IconTrash,
      hidden: !props.permissions.canDelete,
      danger: true,
    },
  ];

  const visibleActions = actions.filter((action) => !action.hidden);
  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <SidebarSection title="Actions" testId="actions-section">
      <ActionList actions={visibleActions} />
    </SidebarSection>
  );
}

// Uses shared SidebarSection; callers can pass className/testId as needed
