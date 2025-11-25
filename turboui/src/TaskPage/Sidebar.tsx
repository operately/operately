import { IconArchive, IconCalendar, IconLink, IconTrash } from "../icons";
import React from "react";
import { TaskPage } from ".";
import { AvatarWithName } from "../Avatar";
import { WarningCallout } from "../Callouts";
import { DateField } from "../DateField";
import FormattedTime from "../FormattedTime";
import { MilestoneField } from "../MilestoneField";
import { PersonField } from "../PersonField";
import { durationHumanized, isOverdue } from "../utils/time";
import { StatusSelectorV2 } from "../StatusSelectorV2";
import { SidebarNotificationSection, SidebarSection } from "../SidebarSection";

export function Sidebar(props: TaskPage.State) {
  return (
    <div className="sm:col-span-4 space-y-6 hidden sm:block sm:pl-8" data-test-id="task-sidebar"> 
      <DueDate {...props} />
      <Assignees {...props} />
      <Milestone {...props} />
      <CreatedBy {...props} />
      <Subscription {...props} />
      <Actions {...props} />
    </div>
  );
}

// Compact, mobile-only subset of sidebar content
export function MobileSidebar(props: TaskPage.State) {
  return (
    <div className="sm:hidden block mt-4">
      <div className="grid grid-cols-[auto_auto_1fr] gap-4 items-start">
        <div>
          <StatusMobile {...props} />
        </div>
        <div>
          <DueDateMobile {...props} />
        </div>
        <div>
          <AssigneeMobile {...props} />
        </div>
      </div>
      <div className="mt-4">
        <Milestone {...props} />
      </div>
    </div>
  );
}

function DueDate(props: TaskPage.State) {
  const isCompleted = props.status === "done" || props.status === "canceled";

  return (
    <SidebarSection title="Due date">
      <DateField
        date={props.dueDate ?? null}
        onDateSelect={props.onDueDateChange}
        readonly={!props.canEdit}
        showOverdueWarning={!isCompleted}
        placeholder="Set due date"
        testId="task-due-date"
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
        searchData={props.assigneePersonSearch}
        emptyStateMessage="Assign task"
        emptyStateReadOnlyMessage="No assignee"
        testId="assignee"
      />
    </SidebarSection>
  );
}

function DueDateMobile(props: TaskPage.State) {
  const isCompleted = props.status === "done" || props.status === "canceled";

  return (
    <SidebarSection title="Due date">
      <DateField
        date={props.dueDate ?? null}
        onDateSelect={props.onDueDateChange}
        readonly={!props.canEdit}
        showOverdueWarning={!isCompleted}
        placeholder="Set due date"
        calendarOnly
        size="small"
      />
    </SidebarSection>
  );
}

function AssigneeMobile(props: TaskPage.State) {
  return (
    <SidebarSection title="Assignee">
      <PersonField
        person={props.assignee}
        setPerson={props.onAssigneeChange}
        readonly={!props.canEdit}
        searchData={props.assigneePersonSearch}
        emptyStateMessage="Assign task"
        emptyStateReadOnlyMessage="No assignee"
        size="small"
        showTitle={false}
      />
    </SidebarSection>
  );
}

function StatusMobile(props: TaskPage.State) {
  return (
    <SidebarSection title="Status">
      <StatusSelectorV2
        statusOptions={props.statusOptions ?? []}
        status={props.status}
        onChange={props.onStatusChange}
        size="sm"
        readonly={!props.canEdit}
        showFullBadge={true}
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
        milestones={props.milestones}
        onSearch={props.onMilestoneSearch}
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
        <AvatarWithName person={props.createdBy} size={"tiny"} nameFormat="short" link={props.createdBy.profileLink} />
        <div className="flex items-center gap-1.5 ml-1 text-content-dimmed text-xs">
          <IconCalendar size={14} />
          <FormattedTime time={props.createdAt} format="short-date" />
        </div>
      </div>
    </SidebarSection>
  );
}

function Subscription(props: TaskPage.State) {
  return <SidebarNotificationSection {...props.subscriptions} />;
}

function Actions(props: TaskPage.State) {
  const actions = [
    {
      label: "Copy URL",
      onClick: () => navigator.clipboard.writeText(window.location.href),
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
      testId: "delete-task",
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
            data-test-id={action.testId}
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
