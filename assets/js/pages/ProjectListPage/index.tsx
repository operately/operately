import React from "react";

import { useProjects } from "@/graphql/Projects";
import FormattedTime from "@/components/FormattedTime";
import AvatarList from "@/components/AvatarList";
import { Link } from "react-router-dom";
import * as Icons from "tabler-icons-react";

function DateOrNotSet({ date }) {
  if (date === null) {
    return <span className="text-white-3 uppercase">not set</span>;
  }
  return (
    <div className="uppercase">
      <FormattedTime time={date} format="short-date" />
    </div>
  );
}

function Phase({ phase }) {
  switch (phase) {
    case "draft":
      return (
        <span className="bg-shade-1 p-1 px-2 uppercase text-xs font-bold text-white-2">
          draft
        </span>
      );
  }
}

function Flare() {
  return (
    <div
      className="absolute"
      style={{
        top: 0,
        left: 0,
        right: 0,
        height: "500px",
        background:
          "radial-gradient(circle at top center, #FFFF0008 0%, #00000000 50%)",
        pointerEvents: "none",
      }}
    ></div>
  );
}

function ProjectListItem({ project }) {
  return (
    <Link to={`/projects/${project.id}`}>
      <div className="flex items-center justify-between gap-4 bg-shade-1 py-2 px-4 rounded border border-transparent hover:border-white-1">
        <div className="font-medium text-white-1 flex items-center w-1/3">
          {project.name}
        </div>

        <div className="flex items-center justify-between gap-4 w-1/2">
          <div className="flex items-center justify-between gap-4 w-1/3">
            <div className="w-1/3 text-sm">
              <AvatarList people={project.contributors.map((c) => c.person)} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 w-2/3">
            <div className="w-32 text-sm text-right">
              <DateOrNotSet date={project.startedAt} />
            </div>

            <div className="w-32 text-sm text-right">
              <DateOrNotSet date={project.deadline} />
            </div>

            <div className="w-32 text-sm text-right">
              <Phase phase={project.phase} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SortProjects(projects) {
  return [].concat(projects).sort((a, b) => {
    let aStart = a.startedAt || 0;
    let bStart = b.startedAt || 0;

    if (aStart > bStart) return -1;
    if (aStart < bStart) return 1;
    return 0;
  });
}

export function ProjectListPage() {
  const { loading, error, data } = useProjects({});

  if (loading) return <p>Loading...</p>;
  if (error) throw new Error(error.message);

  const projects = SortProjects(data.projects);

  return (
    <div className="mt-20 flex flex-col gap-[2px] max-w-6xl mx-auto">
      <Flare />
      <div className="flex items-center justify-between gap-4 mb-10">
        <div className="flex items-center justify-between gap-4">
          <div className="p-2 rounded-full bg-pink-400/20 text-white-2 border border-pink-400">
            <Icons.LayoutList size={16} className="text-pink-400" />
          </div>

          <div className="p-2 rounded-full border border-white-3 text-white-2 hover:bg-shade-1 cursor-pointer">
            <Icons.Map size={16} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <button className="border border-white-2 rounded-lg hover:border-white-2 text-white-2 hover:text-white-1 px-3 py-1.5 font-medium flex items-center gap-2">
            <Icons.ClipboardList size={16} className="text-green-400" />
            New Project
          </button>
        </div>
      </div>

      <div className="mb-16 flex flex-col items-center justify-between gap-8">
        <div className="text-5xl font-bold text-center">
          Projects in Rendered Text
        </div>

        <div className="flex items-center justify-between gap-3">
          <button className="border border-orange-400 text-orange-400 bg-orange-400/20 rounded-full hover:border-orange-800 text-dark-1 hover:text-white-1 px-3 py-1.5 text-sm font-bold">
            All Projects
          </button>

          <button className="border border-white-2 rounded-full hover:border-white-2 text-white-2 hover:text-white-1 px-3 py-1.5 text-sm font-medium">
            Only Mine
          </button>

          <button className="border border-white-2 rounded-full hover:border-white-2 text-white-2 hover:text-white-1 px-3 py-1.5 text-sm font-medium">
            Overdue
          </button>

          <button className="border border-white-2 rounded-full hover:border-white-2 text-white-2 hover:text-white-1 px-3 py-1.5 text-sm font-medium">
            Drafts
          </button>
        </div>
      </div>

      <div className="flex items-center justify-betweeen px-4 py-2 mb-1 rounded text-sm font-medium">
        <div className="w-1/2 text-white-2 uppercase">PROJECT NAME</div>

        <div className="w-1/2 flex items-center justify-between">
          <div className="text-white-2 uppercase">CONTRIBUTORS </div>

          <div className="w-2/3 flex items-center justify-between gap-4">
            <div className="w-32 text-white-2 uppercase text-right">
              STARTED
            </div>

            <div className="w-32 text-white-2 uppercase text-right">
              DEADLINE
            </div>

            <div className="w-32 text-white-2 uppercase text-right">PHASE</div>
          </div>
        </div>
      </div>

      {projects.map((project) => (
        <ProjectListItem project={project} key={project.id} />
      ))}
    </div>
  );
}
