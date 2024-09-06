import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";

import { ProjectContributor } from "@/models/projects";
import { Tooltip } from "@/components/Tooltip";
import { Paths } from "@/routes/paths";
import { DivLink } from "../Link";

import Avatar from "@/components/Avatar";
import classNames from "classnames";
import { TestableElement } from "@/utils/testid";
import { useColorMode } from "@/contexts/ThemeContext";

interface ContributorAvatarProps {
  contributor: ProjectContributor;
}

export function ContributorAvatar(props: ContributorAvatarProps) {
  return (
    <div className={`shrink-0 relative ${borderClass(props.contributor.role!)}`}>
      <Avatar person={props.contributor.person!} size={32} />
    </div>
  );
}

function borderClass(role: string) {
  return classNames("border rounded-full p-0.5 text-content-subtle", {
    "border-yellow-500": role === "champion",
    "border-sky-500": role === "reviewer",
    "border-surface-outline": role !== "champion" && role !== "reviewer",
  });
}

export function ChampionPlaceholder({ project }: { project: Projects.Project }) {
  return (
    <Placeholder
      project={project}
      tooltipTitle="No champion assigned"
      tooltipText="Assign a champion to lead the project and make sure it stays on track."
      testId="champion-placeholder"
    />
  );
}

export function ReviewerPlaceholder({ project }: { project: Projects.Project }) {
  return (
    <Placeholder
      project={project}
      tooltipTitle="No reviewer assigned"
      tooltipText="Assign a reviewer to get feedback and keep things moving smoothly."
      testId="reviewer-placeholder"
    />
  );
}

interface PlaceholderProps extends TestableElement {
  project: Projects.Project;
  tooltipTitle: string;
  tooltipText: string;
}

function Placeholder(props: PlaceholderProps) {
  const colorMode = useColorMode();

  const tooltipContent = (
    <div className="w-64">
      <p className="font-bold mb-1">{props.tooltipTitle}</p>
      <p className="text-sm">{props.tooltipText}</p>
    </div>
  );

  const path = Paths.projectContributorsPath(props.project.id!);
  const className = classNames("flex items-center justify-center rounded-full", {
    "bg-yellow-500/10": colorMode === "light",
    "bg-yellow-500/20": colorMode === "dark",
  });

  const iconColor = colorMode === "light" ? "text-yellow-800" : "text-yellow-600";

  return (
    <Tooltip content={tooltipContent}>
      <div className="shrink-0 relative p-1">
        <DivLink to={path} className={className} style={{ width: 38, height: 38 }} testId={props.testId}>
          <Icons.IconQuestionMark size={20} className={iconColor} stroke={3} />
        </DivLink>
      </div>
    </Tooltip>
  );
}
