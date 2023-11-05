import React from "react";

import client from "@/graphql/client";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "@/layouts/header";
import { LIST_PROJECTS, Project } from "@/graphql/Projects";
import FormattedTime from "@/components/FormattedTime";

import Button from "@/components/Button";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import Avatar from "@/components/Avatar";

import { Indicator } from "@/components/ProjectHealthIndicators";

import { OptionsBar, useOptionsState } from "./OptionsBar";

export async function loader() {
  let projects = await client.query({
    query: LIST_PROJECTS,
    fetchPolicy: "network-only",
    variables: {
      filter: {
        includeArchived: true,
      },
    },
  });

  return {
    projects: projects.data.projects,
  };
}

export function Page() {
  useDocumentTitle("Projects");

  const [data] = Paper.useLoadedData() as [{ projects: any; company: any }];
  const navigate = useNavigate();

  const projects = SortProjects(data.projects);
  const options = useOptionsState();

  return (
    <Paper.Root size="medium">
      <div className="flex items-center justify-between mb-6">
        <div className="font-extrabold text-2xl text-center">Projects</div>

        <div className="flex items-center justify-center">
          <Button variant="success" onClick={() => navigate("/projects/new")} data-test-id="add-project">
            <span className="font-semibold">Start a New Project</span>
          </Button>
        </div>
      </div>

      <OptionsBar options={options} />
      {options.layout === "grid" ? <ProjectGrid projects={projects} /> : <ProjectList projects={projects} />}
    </Paper.Root>
  );
}

function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      {projects.map((project) => {
        return <ProjectGridItem project={project} key={project.id} />;
      })}
    </div>
  );
}

function ProjectGridItem({ project }: { project: Project }) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-dark-2 rounded-lg p-4 flex flex-col gap-2 cursor-pointer shadow-lg hover:shadow-xl"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="flex flex-col justify-between h-28">
        <div>
          <div className="text-ellipsis font-bold">{project.name}</div>
          <NextMilestone project={project} />
        </div>

        <div className="flex items-center gap-2">
          {project.contributors.map((contributor) => (
            <Avatar key={contributor.id} person={contributor.person} size="small" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div className="flex flex-col gap-4">
      {projects.map((project) => {
        return <ProjectListItem project={project} key={project.id} />;
      })}
    </div>
  );
}

function ProjectListItem({ project }: { project: Project }) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-dark-2 rounded-lg p-4 flex flex-col gap-2 cursor-pointer hover:shadow-lg"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="flex items-center justify-between">
        <div className="text-ellipsis font-bold text-lg">{project.name}</div>

        <div className="flex items-center gap-2">
          {project.contributors.map((contributor) => (
            <Avatar key={contributor.id} person={contributor.person} size="tiny" />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-12 mt-6">
        <div>
          <div className="text-xs text-white-1/80 uppercase mb-1">Status</div>
          <Indicator type="status" value={project.health} />
        </div>

        <div>
          <div className="text-xs text-white-1/80 uppercase mb-1">Start Date</div>
          <DateOrNotSet date={project.startedAt} ifNull="&mdash;" />
        </div>

        <div>
          <div className="text-xs text-white-1/80 uppercase mb-1">Due Date</div>
          <DateOrNotSet date={project.deadline} ifNull="&mdash;" />
        </div>

        <div>
          <div className="text-xs text-white-1/80 uppercase mb-1">Next Milestone</div>
          <NextMilestone project={project} />
        </div>
      </div>
    </div>
  );
}

function NextMilestone({ project }) {
  if (project.nextMilestone === null) {
    return <span className="text-sm text-white-2">&mdash;</span>;
  } else {
    return (
      <div className="flex items-center gap-2">
        <Icons.IconFlag3Filled size={16} className="text-yellow-400/80" />
        <span className="text-ellipsis">{project.nextMilestone.title}</span>
      </div>
    );
  }
}

function DateOrNotSet({ date, ifNull }) {
  if (date === null) {
    return <span className="text-sm text-white-2">{ifNull}</span>;
  }
  return (
    <div className="flex items-center gap-2">
      <FormattedTime time={date} format="short-date" />
    </div>
  );
}

function SortProjects(projects: Project[]) {
  let phaseOrder = ["paused", "planning", "execution", "control", "completed", "canceled"];

  return ([] as Project[]).concat(projects).sort((a, b) => {
    let aPhase = phaseOrder.indexOf(a.phase);
    let bPhase = phaseOrder.indexOf(b.phase);

    if (aPhase < bPhase) return -1;
    if (aPhase > bPhase) return 1;

    let aStart = a.startedAt || 0;
    let bStart = b.startedAt || 0;

    if (aStart > bStart) return -1;
    if (aStart < bStart) return 1;
    return 0;
  });
}
