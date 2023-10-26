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

import { TextTooltip } from "@/components/Tooltip";
import Options from "./Options";
import { useNavigateTo } from "@/routes/useNavigateTo";

interface HeaderProps {
  project: Project;
}

export default function Header({ project }: HeaderProps): JSX.Element {
  return (
    <div>
      <ProjectName project={project} />
      <ContributorList project={project} />
      <div className="flex items-center gap-10 mt-6">
        <HealthIndicator health={project.health} />
        <PhaseIndicator project={project} />
        <NextMilestone project={project} />
      </div>
    </div>
  );
}

function ProjectName({ project }) {
  return (
    <div className="flex items-center justify-between">
      <div className={classnames("flex gap-2 items-center", "font-bold", "break-all", "text-3xl", "text-white-1")}>
        {project.name}

        <PrivateIndicator project={project} />
      </div>

      <div className="flex gap-4 items-center">
        <Options project={project} />
      </div>
    </div>
  );
}

function PhaseIndicator({ project }) {
  if (!project.nextMilestone) return null;

  return (
    <div>
      <div className="text-xs uppercase text-white-1/80 font-medium mb-1">Phase</div>
      <div className="font-medium flex items-center gap-1">
        <Icons.IconCircuitBulb size={16} className="text-blue-400" />
        <span className="font-medium capitalize">{project.phase}</span>
      </div>
    </div>
  );
}

function NextMilestone({ project }) {
  if (!project.nextMilestone) return null;

  const gotoMilestone = useNavigateTo(`/projects/${project.id}/milestones/${project.nextMilestone.id}`);

  return (
    <div>
      <div className="text-xs uppercase text-white-1/80 font-medium mb-1">Next milestone</div>
      <div className="font-medium flex items-center gap-1" onClick={gotoMilestone}>
        <Icons.IconFlagFilled size={16} className="text-yellow-400" />
        <span className="font-medium underline decoration-white-2 cursor-pointer"> {project.nextMilestone.title}</span>
      </div>
    </div>
  );
}

function HealthIndicator({ health }) {
  const colors = {
    on_track: "text-green-400",
    at_risk: "text-yellow-400",
    off_track: "text-red-400",
  };

  const color = colors[health];
  const title = health.replace("_", " ");

  return (
    <div>
      <div className="text-xs uppercase text-white-1/80 font-medium mb-1">Status</div>

      <div className="font-medium flex items-center gap-1">
        <Icons.IconCircleFilled size={12} className={color} />
        <span className="font-medium capitalize">{title}</span>
      </div>
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
