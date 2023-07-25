import React from "react";

import client from "@/graphql/client";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "@/layouts/header";
import { LIST_PROJECTS, Project } from "@/graphql/Projects";
import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";

import Button from "@/components/Button";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import { GET_COMPANY, companyID } from "@/graphql/Companies";
import * as Popover from "@radix-ui/react-popover";
import * as Forms from "@/components/Form";

export async function loader() {
  console.log("loader");

  let projects = await client.query({
    query: LIST_PROJECTS,
    fetchPolicy: "network-only",
  });

  let company = await client.query({
    query: GET_COMPANY,
    variables: { id: companyID() },
    fetchPolicy: "network-only",
  });

  return {
    projects: projects.data.projects,
    company: company.data.company,
  };
}

export function Page() {
  useDocumentTitle("Projects");

  const [data] = Paper.useLoadedData() as [{ projects: any; company: any }];
  const navigate = useNavigate();

  const company = data.company;
  const projects = SortProjects(data.projects);

  const [showNextMilestone, setShowNextMilestone] = React.useState(true);
  const [showPhase, setShowPhase] = React.useState(true);
  const [showStartDate, setShowStartDate] = React.useState(true);
  const [showDueDate, setShowDueDate] = React.useState(true);
  const [showChampion, setShowChampion] = React.useState(true);

  return (
    <Paper.Root size="xxlarge">
      <div className="text-center font-extrabold text-3xl mt-4 mb-8 ml-4">Projects in {company.name}</div>

      <Paper.Body className="bg-dark-2" noPadding>
        <div className="flex items-center justify-between mb-4 gap-4 m-4 pt-4">
          <div className="flex items-center gap-2">
            <Popover.Root>
              <Popover.Trigger asChild>
                <div className="flex items-center gap-2 rounded-lg border border-dark-5 py-2 px-4 text-sm font-semibold cursor-pointer">
                  <Icons.IconAdjustmentsHorizontal size={16} />
                  Display
                  <Icons.IconChevronDown size={16} />
                </div>
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Content sideOffset={5} align="start" className="focus:outline-none">
                  <div className="bg-dark-3 rounded-lg p-4 w-64 text-sm border-dark-5 border-2">
                    <div className="flex flex-col gap-2">
                      <Forms.Switch label="Next Milestone" value={showNextMilestone} onChange={setShowNextMilestone} />
                      <Forms.Switch label="Phase" value={showPhase} onChange={setShowPhase} />
                      <Forms.Switch label="Start Date" value={showStartDate} onChange={setShowStartDate} />
                      <Forms.Switch label="Due Date" value={showDueDate} onChange={setShowDueDate} />
                      <Forms.Switch label="Champion" value={showChampion} onChange={setShowChampion} />
                    </div>
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>

          <Button variant="success" onClick={() => navigate("/projects/new")}>
            <Icons.IconPlus size={16} /> New Project
          </Button>
        </div>

        <ProjectList
          projects={projects}
          showNextMilestone={showNextMilestone}
          showPhase={showPhase}
          showStartDate={showStartDate}
          showDueDate={showDueDate}
          showChampion={showChampion}
        />
      </Paper.Body>
    </Paper.Root>
  );
}

function ProjectList({ projects, showNextMilestone, showPhase, showStartDate, showDueDate, showChampion }) {
  var columns: { title: String; size: String; visible: boolean }[] = [];

  columns.push({ title: "Title", size: "flex-1", visible: true });
  columns.push({ title: "Next Milestone", size: "flex-1", visible: showNextMilestone });
  columns.push({ title: "Phase", size: "w-24", visible: showPhase });
  columns.push({ title: "Start Date", size: "w-24", visible: showStartDate });
  columns.push({ title: "Due Date", size: "w-24", visible: showDueDate });
  columns.push({ title: "Champion", size: "w-24", visible: showChampion });

  return (
    <div className="flex flex-col">
      <Headers columns={columns} />

      {projects.map((project) => (
        <ProjectRow key={project.id} project={project} columns={columns} />
      ))}
    </div>
  );
}

function Headers({ columns }) {
  return (
    <Row className="text-sm text-white-2">
      {columns
        .filter((c) => c.visible)
        .map((column, index) => (
          <Cell key={index} size={column.size}>
            {column.title}
          </Cell>
        ))}
    </Row>
  );
}

function ProjectRow({ project, columns }) {
  const navigate = useNavigate();

  return (
    <Row className="hover:bg-dark-3 cursor-pointer" onClick={() => navigate("/projects/" + project.id)}>
      {columns
        .filter((c) => c.visible)
        .map((column, index) => (
          <ProjectCell key={index} project={project} column={column} />
        ))}
    </Row>
  );
}

function ProjectCell({ project, column }) {
  switch (column.title) {
    case "Title":
      return <Cell size={column.size}>{project.name}</Cell>;
    case "Next Milestone":
      let milestone = <NextMilestone project={project} />;

      return <Cell size={column.size}>{milestone}</Cell>;
    case "Phase":
      return <Cell size={column.size}>{project.phase}</Cell>;
    case "Start Date":
      let startDate = <DateOrNotSet date={project.startedAt} ifNull="&mdash;" />;

      return <Cell size={column.size}>{startDate}</Cell>;
    case "Due Date":
      let dueDate = <DateOrNotSet date={project.deadline} ifNull="&mdash;" />;

      return <Cell size={column.size}>{dueDate}</Cell>;
    case "Champion":
      let avatar = <Avatar person={project.champion} size="tiny" />;
      let name = project.champion.fullName.split(" ")[0];
      let champion = (
        <>
          {avatar} {name}
        </>
      );

      return <Cell size={column.size}>{champion}</Cell>;
    default:
      return <Cell size={column.size}> </Cell>;
  }
}

function Row({ children, className = "", onClick }) {
  return (
    <div
      className={
        "flex items-center justify-between gap-4 first:border-t border-b border-shade-1 py-3 px-6 " + className
      }
      onClick={onClick || (() => null)}
    >
      {children}
    </div>
  );
}

function Cell({ children, size, className = "" }) {
  return <div className={"flex items-center gap-2 shrink-0" + " " + size + " " + className}>{children}</div>;
}

function NextMilestone({ project }) {
  if (project.nextMilestone === null) {
    return <span className="text-sm text-white-2">&mdash;</span>;
  } else {
    return <>{project.nextMilestone.title}</>;
  }
}

function DateOrNotSet({ date, ifNull }) {
  if (date === null) {
    return <span className="text-sm text-white-2">{ifNull}</span>;
  }
  return (
    <div className="text-sm">
      <FormattedTime time={date} format="short-date" />
    </div>
  );
}

function SortProjects(projects: Project[]) {
  return ([] as Project[]).concat(projects).sort((a, b) => {
    let aStart = a.startedAt || 0;
    let bStart = b.startedAt || 0;

    if (aStart > bStart) return -1;
    if (aStart < bStart) return 1;
    return 0;
  });
}
