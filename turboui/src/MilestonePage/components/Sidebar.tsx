import React from "react";
import * as Types from "../../TaskBoard/types";
import { DateField } from "../../DateField";
import { AvatarWithName } from "../../Avatar";
import { GhostButton, SecondaryButton } from "../../Button";
import { NotificationToggle } from "../../NotificationToggle";
import { IconArchive, IconCalendar, IconCheck, IconLink, IconTrash } from "../../icons";
import FormattedTime from "../../FormattedTime";
import { MilestonePage } from "..";

export function MilestoneSidebar({
  milestone,
  onDueDateChange,
  onStatusChange,
  createdBy,
  createdAt,
  isSubscribed = false,
  onSubscriptionToggle,
  onCopyUrl,
  onArchive,
  openDeleteModal,
  canEdit = true,
}: MilestonePage.State) {
  return (
    <>
      <SidebarDueDate milestone={milestone} onDueDateChange={onDueDateChange} canEdit={canEdit} />
      <SidebarStatus milestone={milestone} onStatusChange={onStatusChange} canEdit={canEdit} />
      {createdBy && <SidebarCreatedBy createdBy={createdBy} createdAt={createdAt} />}
      <SidebarNotifications isSubscribed={isSubscribed} onSubscriptionToggle={onSubscriptionToggle} />
      <SidebarActions onCopyUrl={onCopyUrl} onArchive={onArchive} onDelete={openDeleteModal} canEdit={canEdit} />
    </>
  );
}

function SidebarSection({ title, children }: { title: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="font-bold text-sm">{title}</div>
      {children}
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
        showOverdueWarning={true}
        placeholder="Set due date"
      />
    </SidebarSection>
  );
}

function SidebarStatus({
  milestone,
  onStatusChange,
  canEdit,
}: {
  milestone: Types.Milestone;
  onStatusChange: (status: Types.Status) => void;
  canEdit: boolean;
}) {
  const isCompleted = milestone.status === "done";

  const handleStatusToggle = () => {
    // Toggle the completion status (stored as any property for demo)
    const newStatus = isCompleted ? "pending" : "done";
    onStatusChange(newStatus);
  };

  if (!canEdit) {
    return (
      <SidebarSection title="Milestone status">
        <div className="text-sm text-content-base">{isCompleted ? "Completed" : "Active"}</div>
      </SidebarSection>
    );
  }

  return (
    <SidebarSection title="Milestone status">
      <div className="space-y-2">
        <div className="text-sm text-content-base">{isCompleted ? "Completed" : "Active"}</div>
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

function SidebarNotifications(props: { isSubscribed: boolean; onSubscriptionToggle?: (subscribed: boolean) => void }) {
  if (!props.onSubscriptionToggle) return null;

  const handleToggle = (subscribed: boolean) => {
    props.onSubscriptionToggle?.(subscribed);
  };

  return (
    <SidebarSection title="Notifications">
      <NotificationToggle isSubscribed={props.isSubscribed} onToggle={handleToggle} entityType="milestone" />
    </SidebarSection>
  );
}

function SidebarActions({
  onCopyUrl,
  onArchive,
  onDelete,
  canEdit,
}: {
  onCopyUrl?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  canEdit: boolean;
}) {
  const actions = [
    {
      label: "Copy URL",
      onClick: onCopyUrl,
      icon: IconLink,
      show: !!onCopyUrl,
    },
    {
      label: "Archive",
      onClick: onArchive,
      icon: IconArchive,
      show: !!onArchive,
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
