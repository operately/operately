import { IconArchive, IconCalendar, IconLink, IconTrash } from "../icons";
import { NotificationToggle } from "../NotificationToggle";
import React from "react";
import { TaskPage } from ".";
import { AvatarWithName } from "../Avatar";
import { WarningCallout } from "../Callouts";
import { DateField } from "../DateField";
import FormattedTime from "../FormattedTime";
import { MilestoneField } from "../MilestoneField";
import { PersonField } from "../PersonField";
import { durationHumanized, isOverdue } from "../utils/time";

export function Sidebar(props: TaskPage.State) {
  return (
    <div className="sm:col-span-4 space-y-6 hidden sm:block sm:pl-8">
      <DueDate {...props} />
      <Assignees {...props} />
      <Milestone {...props} />
      <CreatedBy {...props} />
      <Subscription {...props} />
      <Actions {...props} />
    </div>
  );
}

function DueDate(props: TaskPage.State) {
  const isCompleted = props.status === "done" || props.status === "canceled";

  return (
    <SidebarSection title="Due Date">
      <DateField
        date={props.dueDate ?? null}
        onDateSelect={props.onDueDateChange}
        readonly={!props.canEdit}
        showOverdueWarning={!isCompleted}
        placeholder="Set due date"
        calendarOnly
      />
      <OverdueWarning {...props} />
    </SidebarSection>
  );
}

function Assignees(props: TaskPage.State) {
  return (
    <SidebarSection title="Assignee">
      <PersonField
        person={props.assignee}
        setPerson={props.onAssigneeChange}
        readonly={!props.canEdit}
        searchPeople={props.searchPeople || (async () => [])}
        emptyStateMessage="Assign task"
        emptyStateReadOnlyMessage="No assignee"
      />
    </SidebarSection>
  );
}

function Milestone(props: TaskPage.State) {
  return (
    <SidebarSection title="Milestone">
      <MilestoneField
        milestone={props.milestone}
        setMilestone={props.onMilestoneChange}
        readonly={!props.canEdit}
        searchMilestones={props.searchMilestones || (async () => [])}
        emptyStateMessage="Select milestone"
        emptyStateReadOnlyMessage="No milestone"
      />
    </SidebarSection>
  );
}

function CreatedBy(props: TaskPage.State) {
  return (
    <SidebarSection title="Created">
      <div className="space-y-2 text-sm">
        <AvatarWithName
          person={props.createdBy}
          size={"tiny"}
          nameFormat="short"
          link={`/people/${props.createdBy.id}`}
        />
        <div className="flex items-center gap-1.5 ml-1 text-content-dimmed text-xs">
          <IconCalendar size={14} />
          <FormattedTime time={props.createdAt} format="short-date" />
        </div>
      </div>
    </SidebarSection>
  );
}

function Subscription(props: TaskPage.State) {
  const handleToggle = (subscribed: boolean) => {
    props.onSubscriptionToggle(subscribed);
  };

  return (
    <SidebarSection title="Notifications">
      <NotificationToggle isSubscribed={props.isSubscribed} onToggle={handleToggle} entityType="task" />
    </SidebarSection>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="font-bold text-sm">{title}</div>
      {children}
    </div>
  );
}

function Actions(props: TaskPage.State) {
  const actions = [
    {
      label: "Copy URL",
      onClick: props.onCopyUrl,
      icon: IconLink,
      show: true,
    },
    {
      label: "Archive",
      onClick: props.onArchive,
      icon: IconArchive,
      show: !!props.onArchive,
    },
    {
      label: "Delete",
      onClick: props.openDeleteModal,
      icon: IconTrash,
      show: props.canEdit,
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

function OverdueWarning(props: TaskPage.State) {
  if (!props.dueDate || !props.dueDate.date) return null;
  if (!isOverdue(props.dueDate.date)) return null;
  if (props.status === "done" || props.status === "canceled") return null; // Don't show overdue for completed tasks

  const duration = durationHumanized(props.dueDate.date, new Date());

  return (
    <div className="mt-2">
      <WarningCallout message={`Overdue by ${duration}.`} />
    </div>
  );
}
