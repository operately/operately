import { useTranslation } from "react-i18next";
import React from "react";
import { ProjectTimeSettings } from "../TimeTracking/ProjectTimeSettings";
import { ActionList } from "../ActionList";
import { SecondaryButton } from "../Button";
import { DateField } from "../DateField";
import { GoalField } from "../GoalField";
import {
  IconCircleArrowRight,
  IconCircleCheck,
  IconCopy,
  IconClock,
  IconFileExport,
  IconInfoCircle,
  IconPlayerPause,
  IconRotateDot,
  IconStack2,
  IconTrash,
} from "../icons";
import { ContributorsSection, ContributorModal } from "../ContributorsSection";
import { LastCheckIn } from "../LastCheckIn";
import { DimmedActionLink } from "../Link";
import { OtherPeopleWithAccessModal } from "../OtherPeopleWithAccess";
import { PersonField } from "../PersonField";
import { PrivacyField } from "../PrivacyField";
import { Tooltip } from "../Tooltip";
import { SidebarNotificationSection, SidebarSection } from "../SidebarSection";
import { showSuccessToast, showErrorToast } from "../Toasts";
import { ProjectPage } from ".";
import { CheckInOverdueCallout } from "./CheckInOverdueCallout";
import { viewerCanPostCheckIn } from "./checkInPermissions";

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
        <Privacy {...props} />
      </div>

      <SidebarNotificationSection {...props.subscriptions} className="pt-6 mt-6 border-t border-surface-outline" />

      <div className="pt-6 mt-6 border-t border-surface-outline">
        <Actions {...props} />
      </div>
    </div>
  );
}

function CheckInsSection(props: ProjectPage.State) {
  const { t } = useTranslation();
  const checkIns = props.checkIns || [];
  const isClosed = props.state === "closed";
  const lastCheckInState: "active" | "closed" | undefined = isClosed ? "closed" : "active";
  const viewerCanCheckIn = viewerCanPostCheckIn(props);
  const championFirstName = props.champion?.fullName?.split(" ")[0];

  let zeroStateCopy = t("Weekly check-ins keep everyone in the loop. Updates will appear here.");

  if (isClosed) {
    zeroStateCopy = t("This project is closed. Earlier check-ins stay available for reference.");
  } else if (viewerCanCheckIn) {
    zeroStateCopy = t("Share the first update to set the project status and start the weekly cadence.");
  } else if (championFirstName) {
    zeroStateCopy = t("{{championName}} hasn't shared a check-in yet. Updates will land here soon.", {
      championName: championFirstName,
    });
  }

  const header = (
    <div className="flex items-center gap-2">
      <span>{t("Last update")}</span>
      {viewerCanCheckIn && (
        <span className="shrink-0">
          <SecondaryButton size="xxs" linkTo={props.newCheckInLink} testId="sidebar-check-in-button">
            {t("Check in")}
          </SecondaryButton>
        </span>
      )}
    </div>
  );

  return (
    <SidebarSection title={header} className="pt-4 sm:pt-0">
      <div className="space-y-3">
        <CheckInOverdueCallout {...props} variant="compact" />
        {checkIns.length > 0 ? (
          <LastCheckIn
            checkIns={checkIns}
            state={lastCheckInState}
            mentionedPersonLookup={props.richTextHandlers.mentionedPersonLookup}
            formattedTimePreferences={props.formattedTimePreferences}
          />
        ) : (
          <p className="text-sm text-content-dimmed">{zeroStateCopy}</p>
        )}
      </div>
    </SidebarSection>
  );
}

function ParentGoal(props: ProjectPage.State) {
  const { t } = useTranslation();
  if (!props.parentGoal && !props.permissions.canEdit) {
    return null;
  }

  return (
    <SidebarSection title={t("Parent goal")}>
      <GoalField
        testId="parent-goal-field"
        goal={props.parentGoal}
        setGoal={props.setParentGoal}
        searchGoals={props.parentGoalSearch}
        readonly={!props.permissions.canEdit}
        emptyStateMessage={t("Set parent goal")}
        emptyStateReadOnlyMessage={t("No parent goal")}
      />
    </SidebarSection>
  );
}

function ProjectDates(props: ProjectPage.State) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <SidebarSection title={t("Start date")}>
        <DateField
          date={props.startedAt || null}
          onDateSelect={props.setStartedAt || (() => {})}
          readonly={!props.permissions.canEdit}
          placeholder={t("Set start date")}
          showOverdueWarning={false}
          useStartOfPeriod={true}
          testId="project-start-date"
        />
      </SidebarSection>
      <SidebarSection title={t("Due date")}>
        <DateField
          date={props.dueAt || null}
          onDateSelect={props.setDueAt || (() => {})}
          readonly={!props.permissions.canEdit}
          placeholder={t("Set due date")}
          testId="project-due-date"
          showOverdueWarning={props.state === "active"}
          showOverdueMessage={props.state === "active"}
        />
      </SidebarSection>
    </div>
  );
}

function Champion(props: ProjectPage.State) {
  const { t } = useTranslation();
  const readonly = !props.permissions.hasFullAccess || !("setChampion" in props) || !("championSearch" in props);
  return (
    <SidebarSection
      title={
        <div className="flex items-center gap-2">
          <span>{t("Champion")}</span>
          <Tooltip
            content={
              <div className="max-w-xs">
                <div className="font-semibold mb-2">{t("Project champion")}</div>
                <div className="text-sm">
                  {t(
                    "The project owner accountable for completion. Plans, assigns responsibilities, and submits weekly check-ins.",
                  )}
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
          emptyStateMessage={t("Set champion")}
          emptyStateReadOnlyMessage={t("No champion")}
        />
      ) : (
        <PersonField
          testId="champion-field"
          person={props.champion}
          setPerson={props.setChampion}
          searchData={props.championSearch}
          emptyStateMessage={t("Set champion")}
          emptyStateReadOnlyMessage={t("No champion")}
        />
      )}
    </SidebarSection>
  );
}

function Reviewer(props: ProjectPage.State) {
  const { t } = useTranslation();
  const readonly = !props.permissions.hasFullAccess || !("setReviewer" in props) || !("reviewerSearch" in props);
  return (
    <SidebarSection
      title={
        <div className="flex items-center gap-2">
          <span>{t("Reviewer")}</span>
          <Tooltip
            content={
              <div className="max-w-xs">
                <div className="font-semibold mb-2">{t("Project reviewer")}</div>
                <div className="text-sm">
                  {t(
                    "Provides feedback throughout the project, and is responsible for acknowledging weekly check-ins.",
                  )}
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
          emptyStateMessage={t("Set reviewer")}
          emptyStateReadOnlyMessage={t("No reviewer")}
        />
      ) : (
        <PersonField
          testId="reviewer-field"
          person={props.reviewer || null}
          setPerson={props.setReviewer || (() => {})}
          searchData={props.reviewerSearch}
          emptyStateMessage={t("Set reviewer")}
          emptyStateReadOnlyMessage={t("No reviewer")}
        />
      )}
    </SidebarSection>
  );
}

function Privacy(props: ProjectPage.State) {
  const { t } = useTranslation();
  const [otherPeopleOpen, setOtherPeopleOpen] = React.useState(false);

  const openOtherPeople = () => {
    setOtherPeopleOpen(true);
    props.otherPeopleWithAccess.onRequestLoad();
  };

  return (
    <SidebarSection title={t("Privacy")}>
      <PrivacyField
        testId="project-privacy-field"
        accessLevels={props.accessLevels}
        setAccessLevels={props.setAccessLevels}
        resourceType={"project"}
        readonly={!props.permissions.hasFullAccess}
      />
      <div className="mt-3">
        <DimmedActionLink
          onClick={openOtherPeople}
          testId="other-people-with-access-link"
          underline="hover"
          className="text-xs"
        >
          {t("Who else has access?")}
        </DimmedActionLink>
      </div>
      <OtherPeopleWithAccessModal
        isOpen={otherPeopleOpen}
        onClose={() => setOtherPeopleOpen(false)}
        people={props.otherPeopleWithAccess.people}
        loading={props.otherPeopleWithAccess.loading}
      />
    </SidebarSection>
  );
}

function Contributors(props: ProjectPage.State) {
  const [editing, setEditing] = React.useState<ProjectPage.Contributor | "new" | null>(null);

  return (
    <>
      <ContributorsSection
        contributors={props.contributors}
        canEdit={Boolean(props.canEditContributors)}
        hasFullAccess={Boolean(props.permissions.hasFullAccess)}
        onAdd={() => setEditing("new")}
        onEdit={(contributor) => setEditing(contributor)}
        onDelete={props.onContributorDelete}
      />

      {editing && props.contributorPersonSearch && (
        <ContributorModal
          contributor={editing === "new" ? null : editing}
          searchData={props.contributorPersonSearch}
          onClose={() => setEditing(null)}
          onCreate={props.onContributorCreate}
          onUpdate={props.onContributorUpdate}
          formTestId="project-contributor-form"
          accessMenuTestId="project-contributor-access"
          allowFullAccess={Boolean(props.permissions.hasFullAccess)}
        />
      )}
    </>
  );
}

function Actions(props: ProjectPage.State) {
  const [timeSettingsOpen, setTimeSettingsOpen] = React.useState(false);
  const { t } = useTranslation();
  const handleCopyURL = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href);
      showSuccessToast(t("Success"), t("Project URL copied to clipboard"));
    } catch {
      showErrorToast(t("Copy failed"), t("Unable to copy URL to clipboard"));
    }
  };

  const actions = [
    {
      type: "action" as const,
      label: t("Time tracking settings"),
      onClick: () => setTimeSettingsOpen(true),
      icon: IconClock,
      testId: "time-tracking-settings",
      hidden: !props.timeTracking?.onEnabledChange,
    },
    {
      type: "action" as const,
      label: t("Copy URL"),
      onClick: handleCopyURL,
      icon: IconCopy,
    },
    {
      type: "action" as const,
      label: t("Move to another space"),
      onClick: props.openMoveModal,
      icon: IconCircleArrowRight,
      hidden: !props.permissions.hasFullAccess || !("space" in props),
    },
    {
      type: "link" as const,
      label: t("Pause project"),
      link: props.pauseLink,
      icon: IconPlayerPause,
      testId: "pause-project",
      hidden: !props.permissions.canEdit || props.state === "closed" || props.state === "paused",
    },
    {
      type: "link" as const,
      label: t("Close project"),
      link: props.closeLink,
      icon: IconCircleCheck,
      testId: "close-project",
      hidden: !props.permissions.canEdit || props.state === "closed",
    },
    {
      type: "link" as const,
      label: t("Resume project"),
      link: props.reopenLink,
      icon: IconRotateDot,
      testId: "resume-project",
      hidden: !props.permissions.canEdit || props.state !== "paused",
    },
    {
      type: "action" as const,
      label: t("Export as Markdown"),
      onClick: props.exportMarkdown,
      icon: IconFileExport,
      testId: "export-as-markdown",
      hidden: !props.exportMarkdown,
    },
    {
      type: "action" as const,
      label: t("Save as template"),
      onClick: props.openSaveAsTemplateModal ?? (() => undefined),
      icon: IconStack2,
      testId: "save-project-as-template-action",
      hidden: !props.saveAsTemplate?.canSave,
    },
    {
      type: "action" as const,
      label: t("Delete"),
      onClick: props.openDeleteModal,
      icon: IconTrash,
      hidden: !props.permissions.hasFullAccess,
      danger: true,
    },
  ];

  const visibleActions = actions.filter((action) => !action.hidden);
  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <SidebarSection title={t("Actions")} testId="actions-section">
      <ActionList actions={visibleActions} />
      {timeSettingsOpen && props.timeTracking?.onEnabledChange && (
        <ProjectTimeSettings
          enabled={props.timeTracking.projectDestination.enabled}
          onChange={props.timeTracking.onEnabledChange}
          onClose={() => setTimeSettingsOpen(false)}
        />
      )}
    </SidebarSection>
  );
}

// Uses shared SidebarSection; callers can pass className/testId as needed
