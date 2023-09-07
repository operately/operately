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
import * as Popover from "@/components/Popover";
import FormattedTime from "@/components/FormattedTime";
import * as Time from "@/utils/time";

interface HeaderProps {
  project: Project;
}

export default function Header({ project }: HeaderProps): JSX.Element {
  return (
    <div className="relative">
      <ProjectName project={project} />
      <ContributorList project={project} />
    </div>
  );
}

function HealthInfo({ project }) {
  switch (project.health) {
    case "on_track":
      return (
        <Popover.Root>
          <Popover.Trigger asChild>
            <div className="flex items-center gap-1 bg-dark-3 border border-shade-2 text-white-1/80 rounded font-medium cursor-pointer">
              <div className="flex items-center">
                <div className="px-2 py-1 border-r border-shade-2">
                  <ProjectIcons.IconOnTrack />
                </div>
                <div className="px-2 py-1 border-r border-shade-2">On-Track</div>
                <div className="px-2 py-1">
                  <span className="capitalize">{project.phase} Phase</span>
                </div>
              </div>
            </div>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              side="bottom"
              className="w-96 outline-none bg-dark-2 rounded shadow-xl border border-dark-8 mt-4 p-4"
            >
              <p className="font-bold text-white-1">Health: On-Track</p>
              <p>
                Based on the last{" "}
                <a href="#" className="text-blue-400 underline">
                  status update
                </a>{" "}
                from Sep 19th, the project is <span className="font-bold text-white-1">on-track</span> and due to finish
                on <FormattedTime time={project.deadline} format="short-date" />.
              </p>

              <p className="font-bold text-white-1 mt-4">Phase: Planning</p>
              <p>
                The project is in the {project.phase} phase for 19 days. The next phase is {project.nextPhase},
                scheduled to start on <FormattedTime time={Time.today()} format="short-date" />.
              </p>

              <p className="font-bold text-white-1 mt-4">Next Status Update</p>
              <p>
                The next status update is due on <FormattedTime time={Time.today()} format="short-date" />.
              </p>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      );

    case "at_risk":
      return (
        <TextTooltip text="The project is At Risk, based on the latest status update.">
          <div className="flex items-center gap-1 bg-dark-3 border border-shade-2 text-white-2 px-1.5 py-0.5 cursor-default rounded">
            Status <ProjectIcons.IconAtRisk /> <span className="font-semibold text-sm">At-Risk</span>
          </div>
        </TextTooltip>
      );
    case "off_track":
      return (
        <TextTooltip text="The project is Off-Track, based on the latest status update.">
          <div className="flex items-center gap-1 bg-dark-3 border border-shade-2 text-white-2 px-1.5 py-0.5 cursor-default rounded">
            Status <ProjectIcons.IconOffTrack /> <span className="font-semibold text-sm">Off-Track</span>
          </div>
        </TextTooltip>
      );
    case "unknown":
      return (
        <TextTooltip text="The project's health is unknown. Write a status update to set the health.">
          <div className="flex items-center gap-1 bg-dark-3 border border-shade-2 text-white-2 px-1.5 py-0.5 cursor-default rounded">
            Status <ProjectIcons.IconUnknownHealth /> <span className="font-semibold text-sm">Unknown</span>
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
      <div className={classnames("flex gap-2 items-center", "font-bold", "break-all", "text-3xl", "text-white-1")}>
        {project.name}

        <PrivateIndicator project={project} />
      </div>

      <div className="flex items-center gap-2">
        <HealthInfo project={project} />
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
