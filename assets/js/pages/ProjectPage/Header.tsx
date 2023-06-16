import React from "react";

import * as Icons from "@tabler/icons-react";
import ContributorAvatar from "@/components/ContributorAvatar";

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
    <div className="mt-4 flex items-center justify-center">
      <Link to={contributorsPath}>
        <div className="flex items-center justify-center gap-2 cursor-pointer">
          <ContributorList project={project} />
          <AddContributor />
        </div>
      </Link>
    </div>
  );
}

function ContributorList({ project }: { project: Project }) {
  return (
    <>
      {project.contributors.map((c) => (
        <ContributorAvatar key={c.id} contributor={c} />
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
