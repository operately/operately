import React from "react";
import { Tooltip } from "@/components/Tooltip";
import { PermissionLevels } from "@/features/Permissions";
import { joinStr } from "@/utils/strings";
import classNames from "classnames";

export function ProjectAccessLevelBadge({ accessLevel }: { accessLevel: PermissionLevels }) {
  const data = permissionData[accessLevel];
  if (!data) throw new Error(`Invalid access level: ${accessLevel}`);

  return <AccessBadge title={data.title} colors={data.colors} description={data.description.project} />;
}

interface AccessBadgeProps {
  title: string;
  colors: string;
  description: string;
}

function AccessBadge({ title, colors, description }: AccessBadgeProps) {
  const badge = <Badge title={title} colors={colors} />;
  const tooltipContent = <TooltipContent title={title} description={description} />;

  return <Tooltip content={tooltipContent}>{badge}</Tooltip>;
}

function TooltipContent({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-content-dimmed mt-1 w-64">{description}</div>
    </div>
  );
}

function Badge({ title, colors }: { title: string; colors: string }) {
  const className = classNames("text-xs font-semibold rounded-full px-2.5 py-1.5", "uppercase cursor-default", colors);

  return <div className={className}>{title}</div>;
}

const permissionData: PermissionData = {
  [PermissionLevels.FULL_ACCESS]: {
    title: "Full Access",
    colors: "bg-callout-warning text-callout-warning-message",
    description: {
      project: joinStr(
        "Has full access to the project and can perform any action, ",
        "including editing, commenting, checking-in, closing, and ",
        "archiving the project.",
      ),
    },
  },

  [PermissionLevels.EDIT_ACCESS]: {
    title: "Edit Access",
    colors: "bg-callout-info text-callout-info-message",
    description: {
      project: joinStr(
        "Can edit the project, including its details, tasks, and comments, ",
        "and can check-in. Cannot close or archive the project.",
      ),
    },
  },

  [PermissionLevels.COMMENT_ACCESS]: {
    title: "Comment Access",
    colors: "bg-callout-error text-callout-error-message",
    description: {
      project: joinStr(
        "Can comment on the project, including tasks, and check-ins. ",
        "Cannot edit, close, or archive the project.",
      ),
    },
  },

  [PermissionLevels.VIEW_ACCESS]: {
    title: "View Access",
    colors: "bg-callout-success text-callout-success-message",
    description: {
      project: joinStr(
        "Can view the project, including its details, tasks, and comments. ",
        "Cannot edit, comment, close, or archive the project.",
      ),
    },
  },
};

interface PermissionData {
  [level: number]: {
    title: string;
    colors: string;
    description: {
      project: string;
    };
  };
}
