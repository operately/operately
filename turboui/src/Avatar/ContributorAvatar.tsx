import React from "react";
import { IconQuestionMark } from "../icons";
import classNames from "../utils/classnames";
import { Avatar } from ".";
import { ContributorAvatarProps, PlaceholderAvatarSize } from "./types";

const DEFAULT_CONTRIBUTOR_SIZE = 32;

const PLACEHOLDER_DIMENSIONS: Record<PlaceholderAvatarSize, { circle: number; icon: number }> = {
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

export function ContributorAvatar({ person, role, size = DEFAULT_CONTRIBUTOR_SIZE }: ContributorAvatarProps) {
  return (
    <div className={borderClass(role)}>
      <Avatar person={person} size={size} />
    </div>
  );
}

export function PlaceholderAvatar({ size }: { size: PlaceholderAvatarSize }) {
  const dimensions = PLACEHOLDER_DIMENSIONS[size];

  return (
    <div
      className="shrink-0 relative flex items-center justify-center rounded-full bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-600"
      style={{ width: dimensions.circle, height: dimensions.circle }}
    >
      <IconQuestionMark size={dimensions.icon} stroke={3} />
    </div>
  );
}

function borderClass(role: string) {
  return classNames("shrink-0 relative flex rounded-full border p-0.5 text-content-subtle", {
    "border-yellow-500": role === "champion",
    "border-sky-500": role === "reviewer",
    "border-surface-outline": role !== "champion" && role !== "reviewer",
  });
}
