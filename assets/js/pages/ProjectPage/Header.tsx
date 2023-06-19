import React from "react";

import * as Icons from "@tabler/icons-react";
import ContributorAvatar, {
  ChampionPlaceholder,
  ReviewerPlaceholder,
  ContributorAdd,
} from "@/components/ContributorAvatar";

import { Link } from "react-router-dom";
import {
  Project,
  isReviwerAssigned,
  isChampionAssigned,
} from "@/graphql/Projects";

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
        <div className="flex items-center justify-center gap-1.5 cursor-pointer">
          <ContributorList project={project} />
          <ContributorAdd />
        </div>
      </Link>
    </div>
  );
}

function ContributorList({ project }: { project: Project }) {
  return (
    <>
      {!isChampionAssigned(project) && <ChampionPlaceholder />}
      {!isReviwerAssigned(project) && <ReviewerPlaceholder />}

      {project.contributors.map((c) => (
        <ContributorAvatar key={c.id} contributor={c} />
      ))}
    </>
  );
}
