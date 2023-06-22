import React from "react";

import classnames from "classnames";

import { useParams } from "react-router-dom";
import * as Projects from "@/graphql/Projects";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as Cards from "@/components/Cards";

import StatusUpdates from "./StatusUpdates";
import Header from "./Header";
import NewUpdate from "./NewUpdate";

import * as Milestones from "@/graphql/Projects/milestones";

export function ProjectPage() {
  const params = useParams();

  const id = params["id"];
  const star = params["*"] || "";
  const tab = "/" + star;

  if (!id) return <p className="mt-16">Unable to find project</p>;

  const { loading, error, data } = Projects.useProject(id);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find project</p>;

  let project = data.project;

  switch (tab) {
    case "/":
      return <Overview project={project} />;

    case "/new_update":
      return <NewUpdate project={project} />;

    default:
      return <p className="mt-16">Unknown path</p>;
  }
}

function Overview({ project }) {
  return (
    <Paper.Root size="large">
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects`}>
          <Icons.IconClipboardList size={16} />
          All Projects
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <Header project={project} />

        <Phases project={project} />

        <div className="grid grid-cols-3 px-16 gap-4 py-4 mb-8 mt-4">
          <DocumentationCard project={project} />
          <MilestonesCard project={project} />
          <KeyResources project={project} />
          <KeyResources project={project} />
        </div>

        <StatusUpdates project={project} />
      </Paper.Body>
    </Paper.Root>
  );
}

function DocumentationCardListItem({ title, completed, pending }) {
  let fileIcon: React.ReactNode | null = null;
  let statusIcon: React.ReactNode | null = null;
  let titleColor: string | null = null;

  if (completed) {
    fileIcon = <Icons.IconFileText size={16} className="text-pink-400" />;
    statusIcon = (
      <Icons.IconCircleCheckFilled size={16} className="text-green-400" />
    );
    titleColor = "text-white-1";
  } else if (pending) {
    fileIcon = <Icons.IconFileDots size={16} className="text-yellow-400/80" />;
    statusIcon = (
      <Icons.IconProgressCheck size={16} className="text-yellow-400" />
    );
    titleColor = "text-white-1";
  } else {
    fileIcon = <Icons.IconFileText size={16} className="text-white-3" />;
    statusIcon = (
      <Icons.IconCircleCheckFilled size={16} className="text-white-3" />
    );
    titleColor = "text-white-3";
  }

  return (
    <div className="border-t border-b border-shade-1 py-1 flex justify-between">
      <div className="flex items-center gap-1">
        <div className="shrink-0">{fileIcon}</div>
        <div className={classnames("text-sm font-medium", titleColor)}>
          {title}
        </div>
      </div>

      <div className="flex items-center gap-1">{statusIcon}</div>
    </div>
  );
}

function DocumentationCard({ project }) {
  return (
    <Cards.Card linkTo={`/projects/${project.id}/documentation`}>
      <Cards.Header>
        <Cards.Title>Documentation</Cards.Title>
      </Cards.Header>

      <Cards.Body>
        <DocumentationCardListItem
          title="Project Pitch"
          completed={project.pitch}
          pending={Projects.shouldBeFilledIn(project, "pitch")}
        />
        <DocumentationCardListItem
          title="Execution Plan"
          completed={project.plan}
          pending={Projects.shouldBeFilledIn(project, "plan")}
        />
        <DocumentationCardListItem
          title="Execution Review"
          completed={project.executionReview}
          pending={Projects.shouldBeFilledIn(project, "execution_review")}
        />
        <DocumentationCardListItem
          title="Control Review"
          completed={project.controlReview}
          pending={Projects.shouldBeFilledIn(project, "control_review")}
        />
        <DocumentationCardListItem
          title="Retrospective"
          completed={project.retrospective}
          pending={Projects.shouldBeFilledIn(project, "retrospective")}
        />
      </Cards.Body>
    </Cards.Card>
  );
}

function MilestonesCard({ project }) {
  const milestones = Milestones.sortByDeadline(project.milestones);

  return (
    <Cards.Card linkTo={`/projects/${project.id}/milestones`}>
      <Cards.Header>
        <Cards.Title>Milestones</Cards.Title>
      </Cards.Header>

      <Cards.Body>
        {milestones.slice(0, 4).map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2 rounded-lg py-1 truncate"
          >
            <div className="shrink-0">
              {m.status === "done" ? (
                <Icons.IconCircleCheck size={20} />
              ) : (
                <Icons.IconCircle size={20} />
              )}
            </div>

            <div className="truncate">{m.title}</div>
          </div>
        ))}

        {milestones.length > 4 && (
          <div className="flex items-center gap-2 rounded-lg py-1 ml-0.5 text-white-2">
            <Icons.IconDotsVertical size={16} />
            {milestones.length - 4} other,{" "}
            {milestones.filter((m) => m.status === "pending").length} pending
          </div>
        )}
      </Cards.Body>
    </Cards.Card>
  );
}

function Timeline({ project }) {
  return (
    <div className="bg-dark-3 rounded-lg text-sm p-4 h-52 shadow cursor-pointer hover:shadow-lg border border-shade-2">
      <div className="">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="font-bold flex items-center uppercase">Timeline</div>
        </div>

        <div>
          <div className="flex items-center gap-2 rounded-lg py-1">
            <Icons.IconClock size={20} />
            Feb 22 -&gt; Jul 22
          </div>

          <div className="flex items-center gap-2 rounded-lg py-1">
            <Icons.IconHammer size={20} />
            Execution Phase
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyResources({ project }) {
  return (
    <Cards.Card linkTo="/">
      <Cards.Header>
        <Cards.Title>Key Resources</Cards.Title>
      </Cards.Header>

      <Cards.Body>
        <div className="flex items-center gap-2 rounded-lg py-1">
          <Icons.IconBrandGithub size={20} />
          GitHub Repository
        </div>

        <div className="flex items-center gap-2 rounded-lg py-1">
          <Icons.IconBrandFigma size={20} />
          Figma Design
        </div>

        <div className="flex items-center gap-2 rounded-lg py-1">
          <Icons.IconFile size={20} />
          Architecture Diagram
        </div>

        <div className="flex items-center gap-2 rounded-lg py-1">
          <Icons.IconBrandSlack size={20} />
          Slack Channel
        </div>
      </Cards.Body>
    </Cards.Card>
  );
}

function Phases({ project }) {
  const times = [
    { name: "Concept", time: "Apr 1st", status: "complete" },
    { name: "Planning", time: "May 5th", status: "complete" },
    { name: "Execution", time: "Jul 1st", status: "active" },
    { name: "Control", time: "Aug 10th", status: "pending" },
    { name: "Closing", time: "Aug 21th", status: "pending" },
  ];

  return (
    <div className="relative">
      <div className="py-3 cursor-pointer grid grid-cols-6 bg-dark-3 border-b border border-shade-2 rounded shadow px-4 mx-16">
        <div className="flex flex-col items-center">
          <div className="font-bold flex items-center gap-2">
            <Icons.IconRocket size={16} className="text-green-400" />
            Created On
          </div>
          <div className="text-sm">Jan 31st</div>
        </div>

        {times.map((phase, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <PhaseIcon status={phase.status} />
              <span className="font-bold">{phase.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              {phase.status === "active" && (
                <span className="">Due:&nbsp;</span>
              )}
              <div className="text-sm">{phase.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhaseIcon({ status }) {
  switch (status) {
    case "start":
      return <Icons.IconCircleDot size={16} className="text-green-400" />;

    case "complete":
      return <Icons.IconCircleCheck size={16} className="text-green-400" />;

    case "active":
      return <Icons.IconCircleDot size={16} className="text-yellow-400" />;

    case "pending":
      return <Icons.IconCircle size={16} />;

    default:
      throw new Error("Invalid status");
  }
}
