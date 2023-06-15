import React from "react";
import * as Icons from "@tabler/icons-react";

import Avatar, { AvatarSize } from "@/components/Avatar";

import { Link } from "react-router-dom";
import { Project } from "@/graphql/Projects";

interface HeaderProps {
  project: Project;
}

export default function Header({ project }: HeaderProps): JSX.Element {
  return (
    <div className="pt-12 pb-8 relative">
      <ProjectName project={project} />
      <Contributors project={project} />
    </div>
  );
}

function ProjectName({ project }) {
  return (
    <div className="text-center text-5xl font-bold max-w-2xl mx-auto">
      {project.name}
    </div>
  );
}

function Contributors({ project }) {
  const contributorsPath = `/projects/${project.id}/contributors`;

  return (
    <Link to={contributorsPath}>
      <div className="mt-4 flex items-center justify-center gap-2 cursor-pointer">
        <ChampionAvatar champion={project.owner} />
        <ContributorList project={project} />
        <AddContributor />
      </div>
    </Link>
  );
}

function ChampionAvatar({ champion }) {
  return (
    <div className="relative border-2 rounded-full border-yellow-400 p-0.5">
      <Avatar person={champion} size={AvatarSize.Small} />
    </div>
  );
}

function ContributorList({ project }: { project: Project }) {
  return (
    <>
      {project.contributors.map((c) => (
        <Avatar key={c.person.id} person={c.person} size={AvatarSize.Small} />
      ))}
    </>
  );
}

function AddContributor() {
  return (
    <div className="border border-white-3 border-dashed rounded-full p-1 text-white-3">
      <Icons.IconPlus />
    </div>
  );
}
