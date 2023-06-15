import React from "react";
import * as Icons from "@tabler/icons-react";

import Avatar, { AvatarSize } from "@/components/Avatar";

import { Link } from "react-router-dom";
import { Project } from "@/graphql/Projects";

interface HeaderProps {
  project: Project;
}

export default function Header({ project }: HeaderProps): JSX.Element {
  const contributorsPath = `/projects/${project.id}/contributors`;

  return (
    <div className="pt-12 pb-8 relative">
      <div className="text-center text-5xl font-bold max-w-2xl mx-auto">
        {project.name}
      </div>

      <Link
        to={contributorsPath}
        className="mt-4 flex items-center justify-center gap-2 cursor-pointer"
      >
        <div className="relative border-2 rounded-full border-yellow-400 p-0.5">
          <Avatar person={project.owner} size={AvatarSize.Small} />
        </div>

        {project.contributors.map((c) => (
          <Avatar key={c.person.id} person={c.person} size={AvatarSize.Small} />
        ))}

        <div className="border border-white-3 border-dashed rounded-full p-1 text-white-3">
          <Icons.IconPlus />
        </div>
      </Link>
    </div>
  );
}
