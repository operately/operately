import React from "react";
import * as Types from "../../TaskBoard/types";
import { DateField } from "../../DateField";
import { AvatarWithName } from "../../Avatar";
import { GhostButton, SecondaryButton } from "../../Button";
import { NotificationToggle } from "../../NotificationToggle";
import { IconArchive, IconCalendar, IconCheck, IconLink, IconTrash } from "../../icons";
import FormattedTime from "../../FormattedTime";

interface Props {
  milestone: Types.Milestone;
  onDueDateChange?: (milestoneId: string, dueDate: DateField.ContextualDate | null) => void;
  onMilestoneUpdate?: (milestoneId: string, updates: Types.UpdateMilestonePayload) => void;
  createdBy?: Types.Person;
  createdAt?: Date;
  isSubscribed?: boolean;
  onSubscriptionToggle?: (subscribed: boolean) => void;
  onCopyUrl?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
}

export function MilestoneSidebar({
  milestone,
  onDueDateChange,
  onMilestoneUpdate,
  createdBy,
  createdAt,
  isSubscribed = false,
  onSubscriptionToggle,
  onCopyUrl,
  onArchive,
  onDelete,
  canEdit = true,
}: Props) {
  return (
    <>
      <SidebarDueDate milestone={milestone} onDueDateChange={onDueDateChange} canEdit={canEdit} />
      <SidebarStatus milestone={milestone} onMilestoneUpdate={onMilestoneUpdate} canEdit={canEdit} />
      {createdBy && createdAt && <SidebarCreatedBy createdBy={createdBy} createdAt={createdAt} />}
      <SidebarNotifications isSubscribed={isSubscribed} onSubscriptionToggle={onSubscriptionToggle} />
      <SidebarActions onCopyUrl={onCopyUrl} onArchive={onArchive} onDelete={onDelete} canEdit={canEdit} />
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
  onDueDateChange?: (milestoneId: string, dueDate: DateField.ContextualDate | null) => void;
  canEdit: boolean;
}) {
  return (
    <SidebarSection title="Due Date">
      <DateField
        date={milestone.dueDate || null}
        onDateSelect={(date) => {
          if (onDueDateChange) {
            onDueDateChange(milestone.id, date);
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
  onMilestoneUpdate,
  canEdit,
}: {
  milestone: Types.Milestone;
  onMilestoneUpdate?: (milestoneId: string, updates: Types.UpdateMilestonePayload) => void;
  canEdit: boolean;
}) {
  // Assume milestone has a status field (you may need to add this to Types.Milestone)
  const isCompleted = milestone.status === "done";

  const handleStatusToggle = () => {
    if (onMilestoneUpdate) {
      // Toggle the completion status (stored as any property for demo)
      const newStatus = isCompleted ? "active" : "completed";
      // Pass status info through the callback - parent would handle this
      onMilestoneUpdate(milestone.id, { ...milestone, status: newStatus } as any);
    }
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

function SidebarCreatedBy({ createdBy, createdAt }: { createdBy: Types.Person; createdAt: Date }) {
  return (
    <SidebarSection title="Created">
      <div className="space-y-2 text-sm">
        <AvatarWithName person={createdBy} size="tiny" nameFormat="short" link={`/people/${createdBy.id}`} />
        <div className="flex items-center gap-1.5 ml-1 text-content-dimmed text-xs">
          <IconCalendar size={14} />
          <FormattedTime time={createdAt} format="short-date" />
        </div>
      </div>
    </SidebarSection>
  );
}

function SidebarNotifications({
  isSubscribed,
  onSubscriptionToggle,
}: {
  isSubscribed: boolean;
  onSubscriptionToggle?: (subscribed: boolean) => void;
}) {
  const handleToggle = (subscribed: boolean) => {
    if (onSubscriptionToggle) {
      onSubscriptionToggle(subscribed);
    }
  };

  return (
    <SidebarSection title="Notifications">
      <NotificationToggle isSubscribed={isSubscribed} onToggle={handleToggle} entityType="milestone" />
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
