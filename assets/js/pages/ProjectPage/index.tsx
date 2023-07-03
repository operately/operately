import React from "react";

import classnames from "classnames";

import { useDocumentTitle } from "@/layouts/header";
import { useParams } from "react-router-dom";
import * as Projects from "@/graphql/Projects";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as Cards from "@/components/Cards";

import Activity from "./Activity";
import Header from "./Header";

import * as Milestones from "@/graphql/Projects/milestones";
import Avatar from "@/components/Avatar";
import RichContent from "@/components/RichContent";
import FormattedTime from "@/components/FormattedTime";

export function ProjectPage() {
  const params = useParams();

  const id = params["id"];

  if (!id) return <p className="mt-16">Unable to find project</p>;

  const { loading, error, data } = Projects.useProject(id);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find project</p>;

  let project = data.project;

  return <Overview project={project} />;
}

function Overview({ project }) {
  useDocumentTitle(project.name);

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

        <div className="grid grid-cols-3 px-16 gap-4 py-4 mb-8">
          <MilestonesCard project={project} />
          <DocumentationCard project={project} />
          <StatuUpdatesCard project={project} />
          <KeyResourcesCard project={project} />
        </div>

        <Activity projectId={project.id} />
      </Paper.Body>
    </Paper.Root>
  );
}

function DocumentationCardListItem({ title, completed, pending }) {
  let fileIcon: React.ReactNode | null = null;
  let statusIcon: React.ReactNode | null = null;

  let titleColor: string | null = null;

  if (completed) {
    fileIcon = <Icons.IconFileText size={20} className="text-pink-400" />;
    statusIcon = <Icons.IconCircleCheckFilled size={20} className="text-green-400" />;
    titleColor = "text-white-1";
  } else if (pending) {
    fileIcon = <Icons.IconFileDots size={20} className="text-yellow-400/80" />;
    statusIcon = <Icons.IconProgressCheck size={20} className="text-yellow-400" />;
    titleColor = "text-white-1";
  } else {
    fileIcon = <Icons.IconFileText size={20} className="text-white-3" />;
    statusIcon = <Icons.IconCircleCheckFilled size={20} className="text-white-3" />;
    titleColor = "text-white-3";
  }

  return (
    <div className="border-t border-b border-shade-1 py-1 flex justify-between">
      <div className="flex items-center gap-1">
        <div className="shrink-0">{fileIcon}</div>
        <div className={classnames("font-medium", titleColor)}>{title}</div>
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
          title="Retrospective"
          completed={project.retrospective}
          pending={Projects.shouldBeFilledIn(project, "retrospective")}
        />
      </Cards.Body>
    </Cards.Card>
  );
}

function MilestonesCard({ project }) {
  const milestones = Milestones.sortByDeadline(project.milestones).filter((m) => m.status !== "done");

  return (
    <Cards.Card linkTo={`/projects/${project.id}/milestones`}>
      <Cards.Header>
        <Cards.Title>Timeline</Cards.Title>
      </Cards.Header>

      <Cards.Body>
        <div className="">
          <div className="font-medium text-xs uppercase mb-2 pt-2">Concept PHASE</div>

          {milestones.map((m) => (
            <div className="flex items-start gap-1 border-y border-shade-2 py-1">
              <div className="shrink-0 mt-0.5">
                <Icons.IconFlag2 size={16} className="text-yellow-400" />
              </div>

              <div className="flex-1">
                <div className="font-bold">{milestones[0]?.title}</div>

                {m.deadlineAt && (
                  <div className="text-xs text-white-2">
                    <FormattedTime time={m.deadlineAt} format="short-date-with-weekday-relative" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="font-medium text-xs uppercase mb-2 pt-2">PLANNING PHASE</div>

          {milestones.map((m) => (
            <div className="flex items-start gap-1 border-y border-shade-2 py-1">
              <div className="shrink-0 mt-0.5">
                <Icons.IconFlag2 size={16} className="text-yellow-400" />
              </div>

              <div className="flex-1">
                <div className="font-bold">{milestones[0]?.title}</div>

                {m.deadlineAt && (
                  <div className="font-sm text-white-2">
                    <FormattedTime time={m.deadlineAt} format="short-date-with-weekday-relative" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Cards.Body>
    </Cards.Card>
  );
}

// {milestones.slice(0, 4).map((m) => (
//   <div key={m.id} className="border-t border-b border-shade-1 py-1 flex justify-between">
//     <div className="flex items-center gap-1 font-medium truncate">
//       <div className="shrink-0">
//         {m.status === "done" ? (
//           <Icons.IconCircleCheck size={20} className="text-green-400" />
//         ) : (
//           <Icons.IconCircle size={20} className="text-yellow-400" />
//         )}
//       </div>

//       <div className="truncate">{m.title}</div>
//     </div>
//   </div>
// ))}

// {milestones.length > 4 && (
//   <div className="flex items-center gap-2 rounded-lg py-1 ml-0.5 text-white-2">
//     <Icons.IconDotsVertical size={16} />
//     {milestones.length - 4} other, {milestones.filter((m) => m.status === "pending").length} pending
//   </div>
// )}

function StatusUpdatesCardItem({ update }: { update: Projects.Update }) {
  return (
    <div className="border-t border-b border-shade-1 py-1 flex justify-between items-center">
      <div className="flex items-center gap-1.5 font-medium flex-1 pl-1">
        <div className="shrink-0">
          <Avatar person={update.author} size="tiny" />
        </div>
        <div className="line-clamp-1">
          <RichContent jsonContent={update.message} />
        </div>
      </div>

      <div className="shrink-0">
        {update.acknowledged ? (
          <Icons.IconCircleCheckFilled size={16} className="text-green-400" />
        ) : (
          <Icons.IconClockFilled size={16} className="text-yellow-400" />
        )}
      </div>
    </div>
  );
}

function StatuUpdatesCard({ project }: { project: Projects.Project }) {
  return (
    <Cards.Card linkTo={`/projects/${project.id}/updates`}>
      <Cards.Header>
        <Cards.Title>Status Updates</Cards.Title>
      </Cards.Header>

      <Cards.Body>
        {project.updates.map((update) => (
          <StatusUpdatesCardItem key={update.id} update={update} />
        ))}
      </Cards.Body>
    </Cards.Card>
  );
}

function KeyResourcesCardItem({ icon, title }) {
  return (
    <div className="border-t border-b border-shade-1 flex items-center gap-1.5 rounded-lg py-1">
      <div className="shrink-0">{icon}</div>
      <div className="truncate">{title}</div>
    </div>
  );
}

function KeyResourcesCard({ project }) {
  return (
    <Cards.Card linkTo="/">
      <Cards.Header>
        <Cards.Title>Key Resources</Cards.Title>
      </Cards.Header>

      <Cards.Body>
        <KeyResourcesCardItem
          icon={<Icons.IconBrandGithub size={20} />}
          title="GitHub Repository for the Operately repository"
        />
        <KeyResourcesCardItem icon={<Icons.IconBrandFigma size={20} />} title="Figma Design" />
        <KeyResourcesCardItem icon={<Icons.IconFileDescription size={20} />} title="Architecture Diagram" />
        <KeyResourcesCardItem icon={<Icons.IconBrandSlack size={20} />} title="Slack Channel" />
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
              {phase.status === "active" && <span className="">Due:&nbsp;</span>}
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
