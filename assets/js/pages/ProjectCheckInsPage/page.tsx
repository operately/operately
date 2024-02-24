import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Pages from "@/components/Pages";
import * as ProjectCheckIns from "@/models/projectCheckIns";

import { useLoadedData } from "./loader";
import { CheckInButton } from "./CheckInButton";
import { Paths } from "@/routes/paths";
import { Summary } from "@/components/RichContent";
import { DivLink } from "@/components/Link";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={[project.name, "Check-Ins"]}>
      <Paper.Root>
        <Navigation />

        <Paper.Body>
          <Header />
          <CheckInList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  const { project } = useLoadedData();

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.projectPath(project.id)}>
        <Icons.IconClipboardList size={16} />
        {project.name}
      </Paper.NavItem>
    </Paper.Navigation>
  );
}

function Header() {
  const { project } = useLoadedData();

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

function CheckInList() {
  const { checkIns } = useLoadedData();
  const groups = ProjectCheckIns.groupCheckInsByMonth(checkIns);

  return (
    <div className="flex flex-col gap-16 mt-16">
      {groups.map((group) => (
        <CheckInGroup key={group.key} group={group} />
      ))}
    </div>
  );
}

function CheckInGroup({ group }: { group: ProjectCheckIns.CheckInGroupByMonth }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm font-medium w-max text-content-dimmed">
        <span className="uppercase">
          {group.month}
          {!isCurrentYear(group.year) && group.year}
        </span>
      </div>

      {group.checkIns.map((c) => (
        <CheckInCard key={c.id} checkIn={c} />
      ))}
    </div>
  );
}

function isCurrentYear(year: number) {
  const currentYear = new Date().getFullYear();
  return year === currentYear;
}

export function CheckInCard({ checkIn }: { checkIn: ProjectCheckIns.ProjectCheckIn }) {
  const { project } = useLoadedData();

  const author = checkIn.author;
  const path = Paths.projectCheckInPath(project.id, checkIn.id);

  return (
    <DivLink className="flex items-start gap-2 rounded-lg cursor-pointer border border-stroke-base" to={path}>
      <div className="flex flex-col relative flex-1 hover:shadow">
        <div className="flex-1 p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-1 ">
            <div className="flex items-center gap-2">
              <Avatar person={author} size={40} />
              <div className="flex flex-col">
                <span className="font-bold text-content-accent leading-snug">{author.fullName}</span>
                <span className="text-content-dimmed text-sm leading-snug">
                  <FormattedTime time={checkIn.insertedAt} format="long-date" />
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <Summary jsonContent={checkIn.description} characterCount={250} />
          </div>
        </div>

        <div className="font-medium flex items-center gap-2 p-3 bg-surface-accent border-t border-stroke-base">
          <div className="bg-green-600 text-sm px-2 py-1 rounded-full h-4 w-4" /> On Track
        </div>
      </div>
    </DivLink>
  );
}
