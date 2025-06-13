import * as Tabs from "@/components/Tabs";
import * as React from "react";

import { Person } from "@/models/people";

import { Avatar } from "turboui";

import { usePaths } from "@/routes/paths";
interface PageHeaderProps {
  person: Person;
  activeTab: "about" | "goals";
}

export function PageHeader(props: PageHeaderProps) {
  const paths = usePaths();
  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar person={props.person} size={72} />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold">{props.person.fullName}</div>
            <SuspendedBadge person={props.person} />
          </div>
          <div className="font-medium">{props.person.title}</div>
        </div>
      </div>

      <Tabs.Root activeTab={props.activeTab}>
        <Tabs.Tab id="about" title="About" linkTo={paths.profilePath(props.person.id!)} />
        <Tabs.Tab id="goals" title="Goals" linkTo={paths.profileGoalsPath(props.person.id!)} />
      </Tabs.Root>
    </div>
  );
}

function SuspendedBadge({ person }: { person: Person }) {
  if (person.suspended) {
    return (
      <span className="bg-surface-dimmed text-content-dimmed text-sm font-medium px-2 rounded-full border border-stroke-base">
        Suspended Account
      </span>
    );
  } else {
    return null;
  }
}
