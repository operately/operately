import React from "react";
import * as Types from "../../TaskBoard/types";
import { DateField } from "../../DateField";
import { AvatarWithName } from "../../Avatar";
import { GhostButton, SecondaryButton } from "../../Button";
import { IconCalendar, IconCheck, IconLink, IconTrash, IconFlagFilled, IconFlag, IconCircleCheckFilled } from "../../icons";
import FormattedTime from "../../FormattedTime";
import { MilestonePage } from "..";
import { SidebarSection, SidebarNotificationSection } from "../../SidebarSection";
import { launchConfetti } from "../../utils/confetti";

export function MilestoneSidebar({
  milestone,
  status,
  onDueDateChange,
  onStatusChange,
  createdBy,
  createdAt,
  subscriptions,
  openDeleteModal,
  permissions,
}: MilestonePage.State) {
  return (
    <div className="sm:col-span-4 hidden sm:block sm:pl-8">
      <div className="space-y-6 mt-4" data-test-id="sidebar">
        <SidebarDueDate milestone={milestone} onDueDateChange={onDueDateChange} canEdit={permissions.canEdit} />
        <SidebarStatus status={status} onStatusChange={onStatusChange} canEdit={permissions.canEdit} />
        {milestone.completedAt && milestone.status === "done" && (
          <SidebarCompletedOn completedAt={milestone.completedAt} />
        )}
        {createdBy && <SidebarCreatedBy createdBy={createdBy} createdAt={createdAt} />}
        <SidebarNotificationSection {...subscriptions} />
        <SidebarActions onDelete={openDeleteModal} canEdit={permissions.canEdit} />
      </div>
    </div>
  );
}

function SidebarDueDate({
  milestone,
  onDueDateChange,
  canEdit,
}: {
  milestone: Types.Milestone;
  onDueDateChange?: (dueDate: DateField.ContextualDate | null) => void;
  canEdit: boolean;
}) {
  // Don't show overdue warning if milestone is completed
  const showOverdueWarning = milestone.status !== "done";
  
  return (
    <SidebarSection title="Due Date">
      <DateField
        date={milestone.dueDate || null}
        onDateSelect={(date) => {
          if (onDueDateChange) {
            onDueDateChange(date);
          }
        }}
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

function SidebarCompletedOn({ completedAt }: { completedAt: Date }) {
  return (
    <SidebarSection title="Completed on">
      <div className="flex items-center gap-1.5 text-sm">
        <IconCircleCheckFilled size={16} className="text-accent-1" />
        <FormattedTime time={completedAt} format="short-date" />
      </div>
    </SidebarSection>
  );
}

function SidebarCreatedBy({ createdBy, createdAt }: { createdBy: MilestonePage.Person; createdAt: Date }) {
  return (
    <SidebarSection title="Created">
      <div className="space-y-2 text-sm">
        <AvatarWithName person={createdBy} size="tiny" nameFormat="short" link={createdBy.profileLink} />
        <div className="flex items-center gap-1.5 ml-1 text-content-dimmed text-xs">
          <IconCalendar size={14} />
          <FormattedTime time={createdAt} format="short-date" />
        </div>
      </div>
    </SidebarSection>
  );
}


function SidebarActions({ onDelete, canEdit }: { onDelete?: () => void; canEdit: boolean }) {
  const actions = [
    {
      label: "Copy URL",
      onClick: () => navigator.clipboard.writeText(window.location.href),
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
