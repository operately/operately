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

      <Paper.Body className="bg-dark-2" noPadding noGradient>
        <div className="flex items-center justify-between mb-4 gap-4 m-4">
          <div className="flex items-center gap-2">
            <Popover.Root>
              <Popover.Trigger asChild>
                <div className="flex items-center gap-2 rounded-lg border border-dark-5 py-2 px-4 text-sm font-semibold">
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
  var titles = ["Title"];
  var sizes = ["flex-1"];

  if (showNextMilestone) {
    titles.push("Next Milestone");
    sizes.push("flex-1");
  }

  if (showPhase) {
    titles.push("Phase");
    sizes.push("w-24");
  }

  if (showStartDate) {
    titles.push("Start Date");
    sizes.push("w-24");
  }

  if (showDueDate) {
    titles.push("Due Date");
    sizes.push("w-24");
  }

  if (showChampion) {
    titles.push("Champion");
    sizes.push("w-24");
  }

  return (
    <div className="flex flex-col">
      <Headers titles={titles} sizes={sizes} />

      {projects.map((project) => (
        <ProjectRow
          key={project.id}
          project={project}
          sizes={sizes}
          showNextMilestone={showNextMilestone}
          showPhase={showPhase}
          showStartDate={showStartDate}
          showDueDate={showDueDate}
          showChampion={showChampion}
        />
      ))}
    </div>
  );
}

function Headers({ titles, sizes }) {
  return (
    <Row className="text-sm text-white-2">
      {titles.map((title, index) => (
        <Cell key={index} size={sizes[index]}>
          {title}
        </Cell>
      ))}
    </Row>
  );
}

function ProjectRow({ project, sizes, showNextMilestone, showPhase, showStartDate, showDueDate, showChampion }) {
  return (
    <Row>
      <Cell size={sizes[0]}>{project.name}</Cell>
      {showNextMilestone && (
        <Cell size={sizes[1]}>
          {" "}
          <NextMilestone project={project} />{" "}
        </Cell>
      )}
      {showPhase && <Cell size={sizes[2]}>{project.phase}</Cell>}
      {showStartDate && (
        <Cell size={sizes[3]}>
          <DateOrNotSet date={project.startedAt} ifNull="&mdash;" />
        </Cell>
      )}
      {showDueDate && (
        <Cell size={sizes[4]}>
          <DateOrNotSet date={project.deadline} ifNull="&mdash;" />
        </Cell>
      )}
      {showChampion && (
        <Cell size={sizes[5]}>
          <Avatar person={project.champion} size="tiny" /> {project.champion.fullName.split(" ")[0]}
        </Cell>
      )}
    </Row>
  );
}

function Row({ children, className = "" }) {
  return (
    <div
      className={
        "flex items-center justify-between gap-4 first:border-t border-b border-shade-1 py-3 px-6 " + className
      }
    >
      {children}
    </div>
  );
}

function Cell({ children, size, className = "" }) {
  return <div className={"flex items-center gap-2 shrink-0" + " " + size + " " + className}>{children}</div>;
}

function TableRow({ project }) {
  const navigate = useNavigate();
  const goToProject = () => navigate(`/projects/${project.id}`);

  return (
    <tr className="border-t border-shade-2 bg-dark-2 hover:bg-dark-3 cursor-pointer" onClick={goToProject}>
      <th scope="row" className="px-6 py-4 font-medium text-white-1 whitespace-nowrap rounded-l-lg">
        <div className="flex items-center gap-2">
          {project.champion && <Avatar person={project.champion} size="tiny" />}
          {project.name}
        </div>
      </th>
      <td className="px-6 py-4 flex items-center gap-1">
        <DateOrNotSet date={project.startedAt} ifNull="Not set" />
      </td>
      <td className="px-6 py-4">
        <DateOrNotSet date={project.deadline} ifNull="Not Due Date" />
      </td>
      <td className="px-6 py-4">
        <Phase phase={project.phase} />
      </td>
      <td className="px-6 py-4 rounded-r-lg overflow-hidden truncate max-w-0" style={{ minWidth: "200px" }}></td>
      <td className="px-6 py-4"></td>
    </tr>
  );
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

function Phase({ phase }) {
  return <span className="text-sm capitalize">{phase}</span>;
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
