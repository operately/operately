import {
  IconAlertTriangleFilled,
  IconArchive,
  IconBell,
  IconBellOff,
  IconCalendar,
  IconLink,
  IconTrash,
} from "../icons";
import React from "react";
import { TaskPage } from ".";
import { AvatarWithName } from "../Avatar";
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
        setDate={props.onDueDateChange}
        readonly={!props.canEdit}
        showOverdueWarning={!isCompleted}
        emptyStateText="Set due date"
        emptyStateReadonlyText="No due date set"
      />
      <OverdueWarning {...props} />
    </SidebarSection>
  );
}

function Assignees(props: TaskPage.State) {
  const currentAssignee = props.assignees?.[0] || null;

  const handleAssigneeChange = (person: TaskPage.Person | null) => {
    props.onAssigneesChange(person ? [person] : []);
  };

  return (
    <SidebarSection title="Assignee">
      <PersonField
        person={currentAssignee}
        setPerson={handleAssigneeChange}
        readonly={!props.canEdit}
        searchPeople={props.searchPeople || (async () => [])}
        emptyStateMessage="Assign task"
        emptyStateReadOnlyMessage="No assignee"
      />
    </SidebarSection>
  );
}

function Milestone(props: TaskPage.State) {
  // Convert legacy milestone data to new format for backward compatibility
  const currentMilestone =
    props.milestone ||
    (props.milestoneLink && props.milestoneName
      ? {
          id: "legacy-milestone",
          title: props.milestoneName,
          projectLink: props.milestoneLink,
        }
      : null);

  const handleMilestoneChange = (milestone: TaskPage.Milestone | null) => {
    if (props.onMilestoneChange) {
      props.onMilestoneChange(milestone);
    }
  };

  return (
    <SidebarSection title="Milestone">
      <MilestoneField
        milestone={currentMilestone}
        setMilestone={handleMilestoneChange}
        readonly={!props.canEdit}
        searchMilestones={props.searchMilestones || (async () => [])}
        onCreateNew={props.onCreateMilestone}
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
  const handleToggle = () => {
    props.onSubscriptionToggle(!props.isSubscribed);
  };

  return (
    <SidebarSection title="Notifications">
      <div className="space-y-2">
        <button
          onClick={handleToggle}
          className="flex items-center gap-2 text-sm hover:bg-surface-highlight rounded px-2 py-1 -mx-2"
        >
          {props.isSubscribed ? (
            <>
              <IconBell size={16} className="text-blue-500" />
              <span>Unsubscribe</span>
            </>
          ) : (
            <>
              <IconBellOff size={16} className="text-content-dimmed" />
              <span>Subscribe</span>
            </>
          )}
        </button>

        <div className="text-xs text-content-dimmed">
          {props.isSubscribed
            ? "You're receiving notifications because you're subscribed to this task."
            : "You're not receiving notifications from this task."}
        </div>
      </div>
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
      onClick: () => props.onDelete(),
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
  if (!props.dueDate) return null;
  if (!isOverdue(props.dueDate)) return null;
  if (props.status === "done" || props.status === "canceled") return null; // Don't show overdue for completed tasks

  const duration = durationHumanized(props.dueDate, new Date());

  return (
    <div className="bg-callout-error p-3 text-callout-warning-message rounded mt-2 text-sm flex items-center gap-2">
      <IconAlertTriangleFilled size={16} className="text-callout-warning-icon" />
      Overdue by {duration}.
    </div>
  );
}
