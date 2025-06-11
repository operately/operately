import { IconAlertTriangleFilled, IconFlag, IconBell, IconBellOff } from "@tabler/icons-react";
import React from "react";
import { TaskPage } from ".";
import { DateDisplayField } from "../DateDisplayField";
import FormattedTime from "../FormattedTime";
import { PersonField } from "../PersonField";
import { Avatar } from "../Avatar";
import { BlackLink } from "../Link";
import { durationHumanized, isOverdue } from "../utils/time";

export function Sidebar(props: TaskPage.State) {
  return (
    <div className="sm:col-span-4 space-y-6 hidden sm:block sm:pl-8">
      <DueDate {...props} />
      <Assignees {...props} />
      <Milestone {...props} />
      <CreatedBy {...props} />
      <Subscription {...props} />
    </div>
  );
}

function DueDate(props: TaskPage.State) {
  return (
    <SidebarSection title="Due Date">
      <DateDisplayField
        date={props.dueDate ?? null}
        setDate={props.onDueDateChange}
        readonly={!props.canEdit}
        showOverdueWarning={true}
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
  if (!props.milestoneLink || !props.milestoneName) {
    return (
      <SidebarSection title="Milestone">
        <div className="text-sm text-content-dimmed">No milestone</div>
      </SidebarSection>
    );
  }

  return (
    <SidebarSection title="Milestone">
      <div className="flex items-start gap-1.5 text-sm">
        <IconFlag size={18} className="text-blue-500 shrink-0 mt-px" />
        <BlackLink to={props.milestoneLink} underline="hover">
          {props.milestoneName}
        </BlackLink>
      </div>
    </SidebarSection>
  );
}

function CreatedBy(props: TaskPage.State) {
  return (
    <SidebarSection title="Created">
      <div className="flex items-center gap-2 text-sm">
        <Avatar person={props.createdBy} size={20} />
        <div>
          <div className="font-medium">{props.createdBy.fullName}</div>
          <div className="text-content-dimmed text-xs">
            <FormattedTime time={props.createdAt} format="short-date" />
          </div>
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

        <div className="text-xs text-content-subtle">
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

function OverdueWarning(props: TaskPage.State) {
  if (!props.dueDate) return null;
  if (!isOverdue(props.dueDate)) return null;

  const duration = durationHumanized(props.dueDate, new Date());

  return (
    <div className="bg-callout-error p-3 text-callout-warning-message rounded mt-2 text-sm flex items-center gap-2">
      <IconAlertTriangleFilled size={16} className="text-callout-warning-icon" />
      Overdue by {duration}.
    </div>
  );
}
