import React from "react";

import { useParams } from "react-router-dom";
import { useProject } from "@/graphql/Projects";

import StatusUpdates from "./StatusUpdates";
import Tabs from "./Tabs";
import Header from "./Header";
import * as Icons from "tabler-icons-react";
import RichContent from "@//components/RichContent";
import Avatar, { AvatarSize } from "@/components/Avatar";

export function ProjectPage() {
  const params = useParams();

  const id = params["id"];
  const tab = params["*"] || "";

  if (!id) return <p className="mt-16">Unable to find project</p>;

  const { loading, error, data } = useProject(id);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find project</p>;

  let project = data.project;

  return (
    <div className="mt-24">
      <div className="mx-auto max-w-5xl relative bg-dark-2 rounded-[20px]">
        <Phases project={project} />
        <Header project={project} />
        <Description project={project} />

        <div className="grid grid-cols-3 px-16 gap-4 py-4 mb-8">
          <Milestones project={project} />
          <KeyResults project={project} />
        </div>

        <StatusUpdates project={project} />
      </div>
    </div>
  );
}

// <Tabs activeTab={tab} project={project} />

function Milestones({ project }) {
  return (
    <div className="bg-dark-3 rounded-lg text-sm p-4 h-48 shadow cursor-pointer hover:shadow-lg border border-shade-2">
      <div className="">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="font-bold flex items-center uppercase">
            Milestones
          </div>
        </div>

        <div>
          {project.milestones.map((m) => (
            <div className="flex items-center gap-2 rounded-lg py-1">
              {m.status === "done" ? (
                <Icons.CircleCheck size={20} />
              ) : (
                <Icons.Circle size={20} />
              )}
              {m.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Timeline({ project }) {
  return (
    <div className="bg-dark-3 rounded-lg text-sm p-4 h-48 shadow cursor-pointer hover:shadow-lg border border-shade-2">
      <div className="">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="font-bold flex items-center uppercase">Timeline</div>
        </div>

        <div>
          <div className="flex items-center gap-2 rounded-lg py-1">
            <Icons.Clock size={20} />
            Feb 22 -&gt; Jul 22
          </div>

          <div className="flex items-center gap-2 rounded-lg py-1">
            <Icons.Hammer size={20} />
            Execution Phase
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyResults({ project }) {
  return (
    <div className="bg-dark-3 rounded-lg text-sm p-4 h-48 shadow cursor-pointer hover:shadow-lg border border-shade-2">
      <div className="">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="font-bold flex items-center uppercase">
            Key Resources
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 rounded-lg py-1">
            <Icons.BrandGithub size={20} />
            GitHub Repository
          </div>

          <div className="flex items-center gap-2 rounded-lg py-1">
            <Icons.BrandFigma size={20} />
            Figma Design
          </div>

          <div className="flex items-center gap-2 rounded-lg py-1">
            <Icons.File size={20} />
            Architecture Diagram
          </div>

          <div className="flex items-center gap-2 rounded-lg py-1">
            <Icons.BrandSlack size={20} />
            Slack Channel
          </div>
        </div>
      </div>
    </div>
  );
}

function Description({ project }) {
  const [expanded, setExpanded] = React.useState(false);

  const toggleExpanded = () => setExpanded(!expanded);

  return (
    <div className="pb-8 px-32">
      <div
        className={
          "flex flex-col gap-1 text-lg transition" +
          " " +
          (expanded ? "" : "line-clamp-4")
        }
      >
        <RichContent jsonContent={project.description} />
      </div>

      <button
        className="text-pink-400 font-bold uppercase border border-pink-400 rounded-full hover:border-white-2 text-white-1 hover:text-white-1 px-3 py-1.5 text-sm flex items-center gap-2 mt-4"
        onClick={toggleExpanded}
      >
        {expanded ? <Icons.ArrowUp size={20} /> : <Icons.ArrowDown size={20} />}
        {expanded ? "Collapse" : "Expand"}
      </button>
    </div>
  );
}

function Phases({ project }) {
  const phases = [
    { name: "Concept", status: "complete" },
    { name: "Planning", status: "complete" },
    { name: "Execution", status: "active" },
    { name: "Control", status: "pending" },
    { name: "Closing", status: "pending" },
  ];

  return (
    <div className="py-3 cursor-pointer grid grid-cols-5 bg-dark-3 border-b border-shade-2 px-16 rounded-t-[20px]">
      {phases.map((phase) => (
        <div className="text-center">
          <div className="font-bold flex items-center justify-center gap-2">
            <PhaseIcon status={phase.status} />
            {phase.name}
          </div>

          <div className="text-sm">Jan 21 -&gt; Mar 31</div>
        </div>
      ))}
    </div>
  );
}

function PhaseIcon({ status }) {
  switch (status) {
    case "complete":
      return <Icons.CircleCheck size={16} className="text-green-400" />;

    case "active":
      return <Icons.CircleDot size={16} className="text-yellow-400" />;

    case "pending":
      return <Icons.Circle size={16} />;

    default:
      throw new Error("Invalid status");
  }
}
