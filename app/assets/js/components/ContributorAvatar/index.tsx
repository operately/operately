import { IconQuestionMark } from "turboui";
import * as React from "react";

import { ProjectContributor } from "@/models/projects";

import { useColorMode } from "@/contexts/ThemeContext";
import classNames from "classnames";
import { Avatar } from "turboui";

type Size = "xs" | "md" | "base" | "lg";

interface ContributorAvatarProps {
  contributor: ProjectContributor;
}

export function ContributorAvatar(props: ContributorAvatarProps) {
  return (
    <div className={`shrink-0 relative ${borderClass(props.contributor.role!)} flex`}>
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
      <IconQuestionMark size={DIMENSIONS[size].icon} className={iconColor} stroke={3} />
    </div>
  );
}
