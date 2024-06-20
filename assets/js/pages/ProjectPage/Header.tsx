import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";

import classnames from "classnames";
import ContributorAvatar from "@/components/ContributorAvatar";

import { Link } from "react-router-dom";
import { DivLink } from "@/components/Link";
import { Project } from "@/models/projects";

import { TextTooltip } from "@/components/Tooltip";
import { Paths } from "@/routes/paths";
import { GhostButton } from "@/components/Button";

interface HeaderProps {
  project: Project;
}

export default function Header({ project }: HeaderProps): JSX.Element {
  return (
    <div>
      <ProjectName project={project} />
      <div className="mt-2"></div>
      <ContributorList project={project} />
    </div>
  );
}

function ProjectName({ project }) {
  return (
    <div className="flex-1 truncate">
      <ParentGoal project={project} />

      <div className={classnames("flex gap-3 items-center", "text-content-accent", "truncate mr-12")}>
        <div className="bg-indigo-500/10 p-1.5 rounded-lg">
          <Icons.IconHexagons size={24} className="text-indigo-500" />
        </div>

        <div className="inline-flex items-center gap-2 truncate">
          <div className="font-bold text-2xl text-content-accent truncate flex-1">{project.name}</div>
        </div>

        <PrivateIndicator project={project} />
      </div>
    </div>
  );
}

function ParentGoal({ project }: { project: Projects.Project }) {
  let goal = project.goal;
  let content: React.ReactNode;

  if (goal) {
    content = (
      <>
        <Icons.IconTarget size={14} className="text-red-500" />
        <DivLink
          to={Paths.goalPath(goal.id!)}
          className="text-sm text-content-dimmed mx-1 hover:underline font-medium"
          testId="project-goal-link"
        >
          {goal.name}
        </DivLink>
      </>
    );
  } else {
    content = <div className="text-sm text-content-dimmed mx-1 font-medium">Not yet connected to a goal</div>;
  }

  return (
    <div className="flex items-center">
      <div className="border-t-2 border-l-2 border-stroke-base rounded-tl w-7 h-2.5 ml-4 mb-1 mt-2.5 mr-1" />
      {content}
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

function ContributorList({ project }: { project: Projects.Project }) {
  const contributorsPath = `/projects/${project.id}/contributors`;
  const sortedContributors = Projects.sortContributorsByRole(project.contributors as Projects.ProjectContributor[]);

  return (
    <div className="flex items-center">
      <Link to={contributorsPath} data-test-id="project-contributors">
        <div className="flex items-center justify-center gap-1 cursor-pointer">
          {sortedContributors!.map((c) => c && <ContributorAvatar key={c.id} contributor={c} />)}

          {project.permissions!.canEditContributors && (
            <div className="ml-2">
              <GhostButton size="xs" type="secondary" testId="manage-team-button">
                Manage Team
              </GhostButton>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
