import React, { useState } from "react";
import { DateField } from "../DateField";
import { PersonField } from "../PersonField";
import { ActionList } from "../ActionList";
import { LastCheckIn } from "../LastCheckIn";
import { GoalField } from "../GoalField";
import { IconCopy, IconCircleArrowRight, IconPlayerPause, IconCircleCheck, IconRotateDot, IconTrash } from "../icons";

export function OverviewSidebar(props: any) {
  return (
    <div className="sm:col-span-4 space-y-6 sm:pl-8">
      <LastCheckInSection {...props} />
      <ParentGoal {...props} />
      <ProjectDates {...props} />
      <Champion {...props} />
      <Reviewer {...props} />
      <Contributors {...props} />
      <NotificationToggle {...props} />
      <Actions {...props} />
    </div>
  );
}

function LastCheckInSection(props: any) {
  if (!props.checkIns || props.checkIns.length === 0) {
    return null;
  }

  return (
    <SidebarSection title="Last Check-In">
      <LastCheckIn checkIns={props.checkIns} state={props.state} mentionedPersonLookup={props.mentionedPersonLookup} />
    </SidebarSection>
  );
}

function ParentGoal(props: any) {
  return (
    <SidebarSection title="Parent Goal">
      <GoalField
        testId="parent-goal-field"
        goal={props.parentGoal || null}
        setGoal={props.setParentGoal || (() => {})}
        searchGoals={props.parentGoalSearch || (async () => [])}
        readonly={!props.canEdit}
        emptyStateMessage="Set parent goal"
        emptyStateReadOnlyMessage="No parent goal"
      />
    </SidebarSection>
  );
}

function ProjectDates(props: any) {
  return (
    <div className="space-y-4">
      <SidebarSection title="Start Date">
        <DateField
          date={props.startedAt || null}
          setDate={props.setStartedAt || (() => {})}
          readonly={!props.canEdit}
          placeholder="Set start date"
          showOverdueWarning={false}
        />
      </SidebarSection>
      <SidebarSection title="Due Date">
        <DateField
          date={props.dueAt || null}
          setDate={props.setDueAt || (() => {})}
          readonly={!props.canEdit}
          placeholder="Set due date"
        />
      </SidebarSection>
    </div>
  );
}

function Champion(props: any) {
  return (
    <SidebarSection title="Champion">
      <PersonField
        person={props.champion}
        setPerson={props.setChampion}
        readonly={!props.canEdit}
        searchPeople={async () => []} // TODO: Add person search
        emptyStateMessage="Set champion"
        emptyStateReadOnlyMessage="No champion"
      />
    </SidebarSection>
  );
}

function Reviewer(props: any) {
  return (
    <SidebarSection title="Reviewer">
      <PersonField
        person={props.reviewer || null}
        setPerson={props.setReviewer || (() => {})}
        readonly={!props.canEdit}
        searchPeople={async () => []} // TODO: Add person search
        emptyStateMessage="Set reviewer"
        emptyStateReadOnlyMessage="No reviewer"
      />
    </SidebarSection>
  );
}

function Contributors(props: any) {
  // Use contributors from props if provided, otherwise use mock
  const contributors = Array.isArray(props.contributors)
    ? props.contributors
    : [
        {
          id: "1",
          fullName: "Alice Johnson",
          avatarUrl: "https://i.pravatar.cc/150?u=alice",
          profileLink: "/people/alice",
          title: "Frontend Development & UI/UX",
        },
        { 
          id: "2", 
          fullName: "Bob Smith", 
          avatarUrl: "https://i.pravatar.cc/150?u=bob", 
          profileLink: "/people/bob",
          title: "Backend Architecture & API Design",
        },
        { 
          id: "3", 
          fullName: "Charlie Brown", 
          avatarUrl: "https://i.pravatar.cc/150?u=charlie", 
          profileLink: "/people/charlie",
          title: "Quality Assurance & Testing",
        },
      ];

  return (
    <SidebarSection title="Contributors">
      {contributors.length > 0 ? (
        <div className="space-y-3">
          {contributors.map((person) => (
            <PersonField
              key={person.id}
              person={person}
              setPerson={() => {}}
              readonly={true}
              searchPeople={async () => []}
              showTitle={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-content-dimmed">No contributors</div>
      )}
    </SidebarSection>
  );
}

function NotificationToggle(_props: any) {
  const [isSubscribed, setIsSubscribed] = useState(true);

  const handleToggle = () => {
    setIsSubscribed(!isSubscribed);
  };

  return (
    <SidebarSection title="Notifications">
      <div className="space-y-2">
        <button
          onClick={handleToggle}
          className="flex items-center gap-2 text-sm hover:bg-surface-highlight rounded px-2 py-1 -mx-2"
        >
          {isSubscribed ? (
            <>
              <IconCircleCheck size={16} className="text-blue-500" />
              <span>Unsubscribe</span>
            </>
          ) : (
            <>
              <IconRotateDot size={16} className="text-content-dimmed" />
              <span>Subscribe</span>
            </>
          )}
        </button>

        <div className="text-xs text-content-dimmed">
          {isSubscribed
            ? "You're receiving notifications because you're subscribed to this project."
            : "You're not receiving notifications from this project."}
        </div>
      </div>
    </SidebarSection>
  );
}

function Actions(props: any) {
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
      onClick: () => console.log("Move to another space"),
      icon: IconCircleArrowRight,
      hidden: !props.canEdit,
    },
    {
      type: "action" as const,
      label: "Pause project",
      onClick: () => console.log("Pause project"),
      icon: IconPlayerPause,
      hidden: !props.canEdit || props.state === "closed",
    },
    {
      type: "link" as const,
      label: "Close project",
      link: props.closeLink,
      icon: IconCircleCheck,
      hidden: !props.canEdit || props.state === "closed",
    },
    {
      type: "link" as const,
      label: "Re-open project",
      link: props.reopenLink,
      icon: IconRotateDot,
      hidden: !props.canEdit || props.state !== "closed",
    },
    {
      type: "action" as const,
      label: "Delete",
      onClick: () => console.log("Delete project"),
      icon: IconTrash,
      hidden: !props.canEdit,
      danger: true,
    },
  ];

  const visibleActions = actions.filter((action) => !action.hidden);
  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <div className="border-t pt-4">
      <SidebarSection title="Actions">
        <ActionList actions={visibleActions} />
      </SidebarSection>
    </div>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-bold text-sm mb-1.5">{title}</div>
      {children}
    </div>
  );
}
