import React from "react";

import classnames from "classnames";
import ContributorAvatar, {
  ChampionPlaceholder,
  ReviewerPlaceholder,
  ContributorAdd,
} from "@/components/ContributorAvatar";

import { Link } from "react-router-dom";
import { Project } from "@/graphql/Projects";
import * as Contributors from "@/graphql/Projects/contributors";
import * as Icons from "@tabler/icons-react";
import * as ProjectIcons from "@/components/ProjectIcons";

import { TextTooltip } from "@/components/Tooltip";

interface HeaderProps {
  project: Project;
}

export default function Header({ project }: HeaderProps): JSX.Element {
  return (
    <div className="pb-8 relative">
      <ProjectName project={project} />
      <ContributorList project={project} />
    </div>
  );
}

function HealthInfo({ project }) {
  switch (project.health) {
    case "on_track":
      return (
        <TextTooltip text="The project is on track, based on the latest status update.">
          <div className="flex items-center gap-1 bg-dark-3 rounded-full border border-green-400/60 text-green-400 px-3 py-1 cursor-default">
            <ProjectIcons.IconOnTrack /> <span className="font-semibold text-sm">On-Track</span>
          </div>
        </TextTooltip>
      );

    case "at_risk":
      return (
        <TextTooltip text="The project is At Risk, based on the latest status update.">
          <div className="flex items-center gap-1 bg-dark-3 rounded-full border border-yellow-400/60 text-yellow-400 px-3 py-1 cursor-default">
            <ProjectIcons.IconAtRisk /> <span className="font-semibold text-sm">At-Risk</span>
          </div>
        </TextTooltip>
      );
    case "off_track":
      return (
        <TextTooltip text="The project is Off-Track, based on the latest status update.">
          <div className="flex items-center gap-1 bg-dark-3 rounded-full border border-red-400/60 text-red-400 px-3 py-1 cursor-default">
            <ProjectIcons.IconOffTrack /> <span className="font-semibold text-sm">Off-Track</span>
          </div>
        </TextTooltip>
      );
    case "unknown":
      return (
        <TextTooltip text="The project's health is unknown. Write a status update to set the health.">
          <div className="flex items-center gap-1 bg-dark-3 rounded-full border border-white-2 text-white-2 px-3 py-1 cursor-default">
            <ProjectIcons.IconUnknownHealth /> <span className="font-semibold text-sm">Unknown</span>
          </div>
        </TextTooltip>
      );
    default:
      throw new Error(`Unknown health: ${project.health}`);
  }
}

function ProjectName({ project }) {
  return (
    <div className="flex items-end justify-between">
      <div className={classnames("flex gap-2 items-center", "font-bold", "break-all", projectNameTextSize(project))}>
        {project.name}

        <PrivateIndicator project={project} />
      </div>
      <HealthInfo project={project} />
    </div>
  );
}

function PrivateIndicator({ project }) {
  if (!project.private) return null;

  return (
    <TextTooltip text="Private project. Visible only to contributors.">
      <div className="mt-1" data-test-id="private-project-indicator">
        <Icons.IconLock size={20} />
      </div>
    </TextTooltip>
  );
}

function projectNameTextSize(project: Project) {
  if (project.name.length > 40) {
    return "text-3xl";
  } else {
    return "text-3xl";
  }
}

function ContributorList({ project }) {
  const contributorsPath = `/projects/${project.id}/contributors`;

  const { champion, reviewer, contributors } = Contributors.splitByRole(project.contributors);

  return (
    <div className="mt-4 flex items-center">
      <Link to={contributorsPath} data-test-id="project-contributors">
        <div className="flex items-center justify-center gap-1.5 cursor-pointer">
          <Champion champion={champion} />
          <Reviewer reviewer={reviewer} />

          {contributors.map((c) => (
            <ContributorAvatar key={c.id} contributor={c} />
          ))}

          {project.permissions.canEditContributors && <ContributorAdd />}
        </div>
      </Link>
    </div>
  );
}

function Champion({ champion }) {
  if (!champion) return <ChampionPlaceholder />;

  return <ContributorAvatar contributor={champion} />;
}

function Reviewer({ reviewer }) {
  if (!reviewer) return <ReviewerPlaceholder />;

  return <ContributorAvatar contributor={reviewer} />;
}
