import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Updates from "@/graphql/Projects/updates";
import * as UpdateContent from "@/graphql/Projects/update_content";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";

import { GhostButton } from "@/components/Button";

import { useLoadedData } from "./loader";
import { createPath } from "@/utils/paths";
import { DivLink } from "@/components/Link";
import { Summary } from "@/components/RichContent";

export function Page() {
  const { goal, updates } = useLoadedData();

  return (
    <Pages.Page title={["Check-Ins", goal.name]}>
      <Paper.Root>
        <Navigation goal={goal} />
        <Paper.Body>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-content-accent text-3xl font-extrabold">Check-Ins</div>
              <div>Asking the champion for a check-in every Friday.</div>
            </div>
            <div>
              <CheckInButton goal={goal} />
            </div>
          </div>

          <UpdateList updates={updates} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation({ goal }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={`/goals/${goal.id}`}>{goal.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}

function CheckInButton({ goal }: { goal: Goals.Goal }) {
  if (!goal.permissions.canCheckIn) return null;

  const path = `/goals/${goal.id}/check-ins/new`;

  return <GhostButton linkTo={path}>Check-In Now</GhostButton>;
}

function UpdateList({ updates }: { updates: Updates.Update[] }) {
  const groups = Updates.groupUpdatesByMonth(updates);

  return (
    <div className="flex flex-col gap-16 mt-16">
      {groups.map((group) => (
        <UpdateGroup key={group.key} group={group} />
      ))}
    </div>
  );
}

function UpdateGroup({ group }: { group: ReturnType<typeof Updates.groupUpdatesByMonth>[0] }) {
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

function CheckInCard({ update }) {
  const content = update.content as UpdateContent.GoalCheckIn;
  const author = update.author;
  const checkInPath = createPath("goals", update.updatableId, "check-ins", update.id);

  return (
    <DivLink
      to={checkInPath}
      className="flex items-start gap-2 p-4 rounded-lg cursor-pointer border border-surface-outline bg-surface-accent"
    >
      <div className="flex flex-col gap-1 relative flex-1">
        <div className="flex items-center justify-between flex-1">
          <div className="flex items-center gap-2">
            <Avatar person={author} size="tiny" />
            <span className="font-bold text-content-accent">{author.fullName}</span>
          </div>

          <span className="text-content-dimmed text-sm">
            <FormattedTime time={update.insertedAt} format="short-date" />
          </span>
        </div>

        <div className="flex-1">
          <Summary jsonContent={content.message} characterCount={250} />
        </div>
      </div>
    </DivLink>
  );
}
