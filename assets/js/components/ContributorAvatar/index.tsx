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

type Size = "xs" | "md" | "base" | "lg";
const DefaultSize: Size = "base";

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

export function ChampionPlaceholder({ project, size }: { project: Projects.Project; size?: Size }) {
  return (
    <Placeholder
      project={project}
      tooltipTitle="No champion assigned"
      tooltipText="Assign a champion to lead the project and make sure it stays on track."
      testId="champion-placeholder"
      size={size || DefaultSize}
    />
  );
}

export function ReviewerPlaceholder({ project, size }: { project: Projects.Project; size?: Size }) {
  return (
    <Placeholder
      project={project}
      tooltipTitle="No reviewer assigned"
      tooltipText="Assign a reviewer to get feedback and keep things moving smoothly."
      testId="reviewer-placeholder"
      size={size || DefaultSize}
    />
  );
}

interface PlaceholderProps extends TestableElement {
  project: Projects.Project;
  tooltipTitle: string;
  tooltipText: string;
  size: Size;
}

function Placeholder(props: PlaceholderProps) {
  const tooltipContent = (
    <div className="w-64">
      <p className="font-bold mb-1">{props.tooltipTitle}</p>
      <p className="text-sm">{props.tooltipText}</p>
    </div>
  );

  const path = Paths.projectContributorsPath(props.project.id!);

  return (
    <Tooltip content={tooltipContent}>
      <div>
        <DivLink to={path} testId={props.testId}>
          <PlaceholderAvatar size={props.size} />
        </DivLink>
      </div>
    </Tooltip>
  );
}

const DIMENSIONS: Record<Size, { circle: number; icon: number }> = {
  xs: {
    circle: 16,
    icon: 12,
  },
  md: {
    circle: 24,
    icon: 16,
  },
  base: {
    circle: 32,
    icon: 18,
  },
  lg: {
    circle: 38,
    icon: 20,
  },
};

export function PlaceholderAvatar({ size }: { size: Size }) {
  const colorMode = useColorMode();

  const className = classNames("shrink-0 relative flex items-center justify-center rounded-full", {
    "bg-yellow-500/10": colorMode === "light",
    "bg-yellow-500/20": colorMode === "dark",
  });

  const iconColor = colorMode === "light" ? "text-yellow-800" : "text-yellow-600";
  const style = { width: DIMENSIONS[size].circle, height: DIMENSIONS[size].circle };

  return (
    <div className={className} style={style}>
      <Icons.IconQuestionMark size={DIMENSIONS[size].icon} className={iconColor} stroke={3} />
    </div>
  );
}
