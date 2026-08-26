import React from "react";
import { DateField } from "../../DateField";
import { AvatarWithName } from "../../Avatar";
import { GhostButton, SecondaryButton } from "../../Button";
import { IconCalendar, IconCheck, IconLink, IconTrash, IconFlagFilled, IconFlag, IconCircleCheckFilled } from "../../icons";
import { RelativeDayField } from "../../RelativeDayField";
import FormattedTime, { type FormattedTimePreferences } from "../../FormattedTime";
import type { MilestonePage } from "../types";
import { isProjectMilestoneState, isTemplateMilestoneState } from "../types";
import { variantFeatures } from "../variantFeatures";
import { SidebarSection, SidebarNotificationSection } from "../../SidebarSection";
import { showSuccessToast, showErrorToast } from "../../Toasts";
import { launchConfetti } from "../../utils/confetti";

export function Sidebar(props: MilestonePage.State) {
  const features = variantFeatures(props.variant);
  const canEdit = props.permissions.canEdit || false;

  return (
    <div className="sm:col-span-4 hidden sm:block sm:pl-8">
      <div className="space-y-6 mt-4" data-test-id={features.sidebarTestId}>
        <DueDate {...props} />
        {features.showStatus && isProjectMilestoneState(props) && (
          <SidebarStatus status={props.status} onStatusChange={props.onStatusChange} canEdit={canEdit} />
        )}
        {features.showCompletedOn &&
          isProjectMilestoneState(props) &&
          props.milestone.completedAt &&
          props.milestone.status === "done" && (
            <SidebarCompletedOn completedAt={props.milestone.completedAt} formattedTimePreferences={props.formattedTimePreferences} />
          )}
        {features.showCreatedBy && isProjectMilestoneState(props) && props.createdBy && (
          <SidebarCreatedBy
            createdBy={props.createdBy}
            createdAt={props.createdAt}
            formattedTimePreferences={props.formattedTimePreferences}
          />
        )}
        {features.showSubscriptions && isProjectMilestoneState(props) && <SidebarNotificationSection {...props.subscriptions} />}
        <SidebarActions onDelete={props.openDeleteModal} canEdit={canEdit} />
      </div>
    </div>
  );
}

function DueDate(props: MilestonePage.State) {
  const features = variantFeatures(props.variant);
  const canEdit = props.permissions.canEdit || false;

  if (features.showRelativeDueDate && isTemplateMilestoneState(props)) {
    return (
      <SidebarSection title="Relative due date">
        <RelativeDayField
          value={props.dueOffsetDays}
          onChange={props.onDueOffsetDaysChange}
          readonly={!canEdit}
          placeholder="Set relative date"
          testId="template-milestone-due-offset"
        />
      </SidebarSection>
    );
  }

  if (!features.showCalendarDueDate || !isProjectMilestoneState(props)) {
    return null;
  }

  const showOverdueWarning = props.milestone.status !== "done";

  return (
    <SidebarSection title="Due Date">
      <DateField
        date={props.milestone.dueDate || null}
        onDateSelect={props.onDueDateChange}
        readonly={!canEdit}
        showOverdueWarning={showOverdueWarning}
        placeholder="Set due date"
        testId="milestone-due-date"
        calendarOnly
      />
    </SidebarSection>
  );
}

function SidebarStatus({
  status,
  onStatusChange,
  canEdit,
}: {
  status: MilestonePage.Status;
  onStatusChange: (status: MilestonePage.Status) => void;
  canEdit: boolean;
}) {
  const isCompleted = status === "done";

  const handleStatusToggle = () => {
    // Toggle the completion status (stored as any property for demo)
    const newStatus = isCompleted ? "pending" : "done";
    if (newStatus === "done") {
      launchConfetti();
    }
    onStatusChange(newStatus);
  };

  if (!canEdit) {
    return (
      <SidebarSection title="Milestone status">
        <div className="flex items-center gap-2 text-sm">
          {isCompleted ? (
            <>
              <IconFlagFilled size={16} className="text-accent-1" />
              <span className="text-accent-1 font-medium">Completed</span>
            </>
          ) : (
            <>
              <IconFlag size={16} className="text-content-dimmed" />
              <span className="text-content-base">Active</span>
            </>
          )}
        </div>
      </SidebarSection>
    );
  }

  return (
    <SidebarSection title="Milestone status" testId="sidebar-status">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          {isCompleted ? (
            <>
              <IconFlagFilled size={16} className="text-accent-1" />
              <span className="text-accent-1 font-medium">Completed</span>
            </>
          ) : (
            <>
              <IconFlag size={16} className="text-content-dimmed" />
              <span className="text-content-base">Active</span>
            </>
          )}
        </div>
        {isCompleted ? (
          <SecondaryButton size="xs" onClick={handleStatusToggle}>
            Reopen
          </SecondaryButton>
        ) : (
          <GhostButton size="xs" icon={IconCheck} onClick={handleStatusToggle}>
            Mark complete
          </GhostButton>
        )}
      </div>
    </SidebarSection>
  );
}

function SidebarCompletedOn({
  completedAt,
  formattedTimePreferences,
}: {
  completedAt: Date;
  formattedTimePreferences: FormattedTimePreferences;
}) {
  return (
    <SidebarSection title="Completed on">
      <div className="flex items-center gap-1.5 text-sm">
        <IconCircleCheckFilled size={16} className="text-accent-1" />
        <FormattedTime {...formattedTimePreferences} time={completedAt} format="short-date" />
      </div>
    </SidebarSection>
  );
}

function SidebarCreatedBy({
  createdBy,
  createdAt,
  formattedTimePreferences,
}: {
  createdBy: MilestonePage.Person;
  createdAt: Date;
  formattedTimePreferences: FormattedTimePreferences;
}) {
  return (
    <SidebarSection title="Created">
      <div className="space-y-2 text-sm">
        <AvatarWithName person={createdBy} size="tiny" nameFormat="short" link={createdBy.profileLink} />
        <div className="flex items-center gap-1.5 ml-1 text-content-dimmed text-xs">
          <IconCalendar size={14} />
          <FormattedTime {...formattedTimePreferences} time={createdAt} format="short-date" />
        </div>
      </div>
    </SidebarSection>
  );
}

function SidebarActions({ onDelete, canEdit }: { onDelete?: () => void; canEdit: boolean }) {
  const handleCopyURL = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showSuccessToast("Success", "Milestone URL copied to clipboard");
    } catch {
      showErrorToast("Copy failed", "Unable to copy URL to clipboard");
    }
  };

  const actions = [
    {
      label: "Copy URL",
      onClick: handleCopyURL,
      icon: IconLink,
      show: true,
    },
    {
      label: "Delete",
      onClick: onDelete,
      icon: IconTrash,
      show: canEdit && !!onDelete,
      danger: true,
    },
  ].filter((action) => action.show);

  if (actions.length === 0) return null;

  return (
    <SidebarSection title="Actions">
      <div className="space-y-1">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`flex items-center gap-2 text-xs hover:bg-surface-highlight rounded px-2 py-1 -mx-2 w-full text-left ${
              action.danger ? "text-content-error hover:bg-red-50" : ""
            }`}
          >
            <action.icon size={16} className={action.danger ? "text-content-error" : "text-content-dimmed"} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </SidebarSection>
  );
}
