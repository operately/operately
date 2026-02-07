import React from "react";
import classNames from "../utils/classnames";

const PERMISSION_LEVELS = {
  FULL_ACCESS: 100,
  ADMIN_ACCESS: 90,
  EDIT_ACCESS: 70,
  COMMENT_ACCESS: 40,
  VIEW_ACCESS: 10,
};

const accessLevelData: Record<
  number,
  {
    title: string;
    colors: string;
  }
> = {
  [PERMISSION_LEVELS.FULL_ACCESS]: {
    title: "Full Access",
    colors: "bg-callout-warning-bg text-callout-warning-content",
  },
  [PERMISSION_LEVELS.ADMIN_ACCESS]: {
    title: "Admin Access",
    colors: "bg-callout-warning-bg text-callout-warning-content",
  },
  [PERMISSION_LEVELS.EDIT_ACCESS]: {
    title: "Edit Access",
    colors: "bg-callout-info-bg text-callout-info-content",
  },
  [PERMISSION_LEVELS.COMMENT_ACCESS]: {
    title: "Comment Access",
    colors: "bg-callout-error-bg text-callout-error-content",
  },
  [PERMISSION_LEVELS.VIEW_ACCESS]: {
    title: "View Access",
    colors: "bg-callout-success-bg text-callout-success-content",
  },
};

export function AccessLevelBadge({ accessLevel, className = "" }: AccessLevelBadge.Props) {
  const data = accessLevelData[accessLevel];

  if (!data) {
    return null;
  }

  const badgeClassName = classNames(
    "inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold uppercase cursor-default",
    data.colors,
    className,
  );

  return <div className={badgeClassName}>{data.title}</div>;
}

export namespace AccessLevelBadge {
  export interface Props {
    accessLevel: number;
    className?: string;
  }
}
