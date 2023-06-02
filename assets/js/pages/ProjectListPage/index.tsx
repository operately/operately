import React from "react";

import { useProjects } from "@/graphql/Projects";
import FormattedTime from "@/components/FormattedTime";
import AvatarList from "@/components/AvatarList";
import { Link } from "react-router-dom";

function DateOrNotSet({ date }) {
  if (date === null) {
    return <span className="text-white-3">not set</span>;
  }
  return (
    <div className="uppercase">
      <FormattedTime time={date} format="short-date" />
    </div>
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
          <div className="flex items-center justify-between gap-4 w-1/2">
            <div className="w-1/3 text-sm">
              <AvatarList
                champion={project.owner}
                people={project.contributors.map((c) => c.person)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 w-1/2">
            <div className="w-32 text-sm text-right">
              <DateOrNotSet date={project.startedAt} />
            </div>

            <div className="w-32 text-sm text-right">
              <DateOrNotSet date={project.deadline} />
            </div>

            <div className="w-20 text-sm text-right">{project.phase}</div>
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
    <div className="mt-32 flex flex-col gap-[2px] max-w-6xl mx-auto">
      <div className="flex items-center justify-betweeen px-4 py-2 bg-shade-1 mb-1 rounded-lg text-xs">
        <div className="w-1/2 text-white-2 uppercase">PROJECT NAME</div>

        <div className="w-1/2 flex items-center justify-between">
          <div className="text-white-2 uppercase">CONTRIBUTORS </div>

          <div className="w-1/2 flex items-center justify-between gap-4">
            <div className="w-32 text-white-2 uppercase text-right">
              STARTED
            </div>

            <div className="w-32 text-white-2 uppercase text-right">
              DEADLINE
            </div>

            <div className="w-20 text-white-2 uppercase text-right">PHASE</div>
          </div>
        </div>
      </div>

      {projects.map((project) => (
        <ProjectListItem project={project} key={project.id} />
      ))}
    </div>
  );
}
