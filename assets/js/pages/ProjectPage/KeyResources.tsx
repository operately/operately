import React from "react";

import * as Icons from "@tabler/icons-react";
import * as Projects from "@/graphql/Projects";
import { KeyResource } from "@/graphql/Projects/key_resources";

export default function KeyResources({ project }: { project: Projects.Project }): JSX.Element {
  return (
    <div className="flex flex-col gap-1 mb-8 border-b border-dark-5 py-4 relative">
      <div className="font-bold flex justify-between items-center">Key Resources</div>

      <div className="flex gap-2 flex-wrap">
        <Body project={project} />
      </div>
    </div>
  );
}

function Body({ project }: { project: Projects.Project }): JSX.Element {
  if (project.keyResources.length === 0) return <EmptyState />;

  return (
    <>
      {project.keyResources.map((kr) => (
        <Link resource={kr} key={kr.id} />
      ))}
    </>
  );
}

function EmptyState() {
  return <div className="text-white-2">No key resources.</div>;
}

function Link({ resource }: { resource: KeyResource }): JSX.Element {
  return (
    <a
      href={resource.link}
      target="_blank"
      className="font-medium bg-shade-1 px-3 py-2 flex items-center gap-2 rounded-lg cursor-pointer text-sm"
    >
      <LinkIcon type={resource.type} />
      {resource.title}
    </a>
  );
}

function LinkIcon({ type }) {
  switch (type) {
    case "github":
      return <Icons.IconBrandGithub size={20} className="text-pink-400" />;
    default:
      return <Icons.IconLink size={20} className="text-pink-400" />;
  }
}
