import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Pages from "@/components/Pages";
import * as Updates from "@/graphql/Projects/updates";

import { useLoadedData } from "./loader";
import { CheckInButton } from "./CheckInButton";
import { CheckInCard } from "@/components/CheckInCard";
import { Paths } from "@/routes/paths";

export function Page() {
  const { project, updates } = useLoadedData();

  return (
    <Pages.Page title={[project.name, "Check-Ins"]}>
      <Paper.Root>
        <Navigation project={project} />

        <Paper.Body>
          <Header project={project} />
          <CheckInList updates={updates} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation({ project }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.projectPath(project.id)}>
        <Icons.IconClipboardList size={16} />
        {project.name}
      </Paper.NavItem>
    </Paper.Navigation>
  );
}

function Header({ project }) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <div className="text-content-accent text-3xl font-extrabold">Check-Ins</div>
        <div>Asking the champion for a check-in every Friday.</div>
      </div>
      <div>
        <CheckInButton project={project} />
      </div>
    </div>
  );
}

function CheckInList({ updates }: { updates: Updates.Update[] }) {
  const groups = Updates.groupUpdatesByMonth(updates);

  return (
    <div className="flex flex-col gap-16 mt-16">
      {groups.map((group) => (
        <CheckInGroup key={group.key} group={group} />
      ))}
    </div>
  );
}

function CheckInGroup({ group }: { group: ReturnType<typeof Updates.groupUpdatesByMonth>[0] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm font-semibold w-max text-content-dimmed">
        <span className="uppercase">
          {group.month}
          {!isCurrentYear(group.year) && group.year}
        </span>
        <span className="mx-1.5">&middot;</span>
        {group.updates.length} Check-In
        {group.updates.length > 1 && "s"}
      </div>

      {group.updates.map((update) => (
        <CheckInCard key={update.id} update={update} />
      ))}
    </div>
  );
}

function isCurrentYear(year: number) {
  const currentYear = new Date().getFullYear();
  return year === currentYear;
}
