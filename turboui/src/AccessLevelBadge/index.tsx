import React from "react";
import { useTranslation } from "react-i18next";
import classNames from "../utils/classnames";

const PERMISSION_LEVELS = {
  FULL_ACCESS: 100,
  ADMIN_ACCESS: 90,
  EDIT_ACCESS: 70,
  COMMENT_ACCESS: 40,
  VIEW_ACCESS: 10,
  MINIMAL_ACCESS: 1,
  NO_ACCESS: 0,
};

const sizeClasses = {
  xs: "px-1.5 py-0.5 text-micro",
  sm: "px-2 py-1 text-xxs",
  base: "px-2.5 py-1.5 text-xs",
};

const accessLevelColors: Record<number, string> = {
  [PERMISSION_LEVELS.FULL_ACCESS]: "bg-callout-warning-bg text-callout-warning-content",
  [PERMISSION_LEVELS.ADMIN_ACCESS]: "bg-callout-warning-bg text-callout-warning-content",
  [PERMISSION_LEVELS.EDIT_ACCESS]: "bg-callout-info-bg text-callout-info-content",
  [PERMISSION_LEVELS.COMMENT_ACCESS]: "bg-callout-error-bg text-callout-error-content",
  [PERMISSION_LEVELS.VIEW_ACCESS]: "bg-callout-success-bg text-callout-success-content",
  [PERMISSION_LEVELS.MINIMAL_ACCESS]: "bg-callout-info-bg text-callout-info-content",
  [PERMISSION_LEVELS.NO_ACCESS]: "bg-callout-info-bg text-callout-info-content",
};

function accessLevelTitle(accessLevel: number, t: (key: string) => string) {
  switch (accessLevel) {
    case PERMISSION_LEVELS.FULL_ACCESS:
      return t("Full Access");
    case PERMISSION_LEVELS.ADMIN_ACCESS:
      return t("Admin Access");
    case PERMISSION_LEVELS.EDIT_ACCESS:
      return t("Edit Access");
    case PERMISSION_LEVELS.COMMENT_ACCESS:
      return t("Comment Access");
    case PERMISSION_LEVELS.VIEW_ACCESS:
      return t("View Access");
    case PERMISSION_LEVELS.MINIMAL_ACCESS:
    case PERMISSION_LEVELS.NO_ACCESS:
      return t("No Access");
    default:
      return null;
  }
}

export function AccessLevelBadge({ accessLevel, size = "base", className = "" }: AccessLevelBadge.Props) {
  const { t } = useTranslation();
  const title = accessLevelTitle(accessLevel, t);
  const colors = accessLevelColors[accessLevel];

  if (!title || !colors) {
    return null;
  }

  const badgeClassName = classNames(
    "inline-flex items-center rounded-full font-semibold uppercase cursor-default",
    sizeClasses[size],
    colors,
    className,
  );

  return <div className={badgeClassName}>{title}</div>;
}

export namespace AccessLevelBadge {
  export interface Props {
    accessLevel: number;
    size?: "xs" | "sm" | "base";
    className?: string;
  }
}
