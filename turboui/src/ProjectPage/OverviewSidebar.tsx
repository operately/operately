import React, { useState } from "react";
import { DateField } from "../DateField";
import { PersonField } from "../PersonField";
import { AvatarWithName } from "../Avatar/AvatarWithName";
import { ActionList } from "../ActionList";
import { IconCopy, IconCircleArrowRight, IconPlayerPause, IconCircleCheck, IconRotateDot, IconTrash } from "../icons";

export function OverviewSidebar(props: any) {
  return (
    <div className="sm:col-span-4 space-y-6 sm:pl-8">
      <LastCheckIn {...props} />
      <ParentGoal {...props} />
      <ProjectDates {...props} />
      <Champion {...props} />
      <Contributors {...props} />
      <NotificationToggle {...props} />
      <Actions {...props} />
    </div>
  );
}

function LastCheckIn(_props: any) {
  return (
    <SidebarSection title="Last Check-In">
      <div className="text-sm text-content-dimmed">No check-ins yet</div>
    </SidebarSection>
  );
}

function ParentGoal(_props: any) {
  return (
    <SidebarSection title="Parent Goal">
      <div className="text-sm text-content-dimmed">No parent goal</div>
    </SidebarSection>
  );
}

function ProjectDates(props: any) {
  return (
    <div className="space-y-4">
      <SidebarSection title="Start Date">
        <DateField
          date={null} // TODO: Add start date to props
          setDate={() => {}} // TODO: Add start date handler
          readonly={!props.canEdit}
          placeholder="Set start date"
        />
      </SidebarSection>
      <SidebarSection title="Due Date">
        <DateField
          date={null} // TODO: Add due date to props
          setDate={() => {}} // TODO: Add due date handler
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
        },
        { id: "2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob", profileLink: "/people/bob" },
      ];

  return (
    <SidebarSection title="Contributors">
      {contributors.length > 0 ? (
        <div className="space-y-2">
          {contributors.map((person) => (
            <AvatarWithName key={person.id} person={person} size="small" link={person.profileLink} nameFormat="short" />
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

  return (
    <SidebarSection title="Notifications">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isSubscribed}
          onChange={(e) => setIsSubscribed(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm">Subscribe to updates</span>
      </label>
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
      <ActionList actions={visibleActions} />
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
