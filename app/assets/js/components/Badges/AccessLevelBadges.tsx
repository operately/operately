import React from "react";
import { Tooltip } from "@/components/Tooltip";
import { PermissionLevels } from "@/features/Permissions";
import { joinStr } from "@/utils/strings";
import classNames from "classnames";
import { assertPresent } from "@/utils/assertions";
import { TestableElement } from "@/utils/testid";

// Public interface

export function ProjectAccessLevelBadge({ accessLevel }: { accessLevel: PermissionLevels | null }) {
  const level = accessLevel ?? PermissionLevels.NO_ACCESS;
  const data = permissionData[level];
  assertPresent(data, `Invalid access level: ${level}`);

  return <AccessBadge title={data.title} colors={data.colors} description={data.description.project} />;
}

export function SpaceAccessLevelBadge({ accessLevel }: { accessLevel: PermissionLevels | null }) {
  const level = accessLevel ?? PermissionLevels.NO_ACCESS;
  const data = permissionData[level];
  assertPresent(data, `Invalid access level: ${level}`);

  return (
    <AccessBadge title={data.title} colors={data.colors} description={data.description.space} testId={data.testId} />
  );
}

export function GoalAccessLevelBadge({ accessLevel }: { accessLevel: PermissionLevels | null }) {
  const level = accessLevel ?? PermissionLevels.NO_ACCESS;
  const data = permissionData[level];
  assertPresent(data, `Invalid access level: ${level}`);

  return <AccessBadge title={data.title} colors={data.colors} description={data.description.goal} />;
}

//
// Private components and utilities
//

interface AccessBadgeProps extends TestableElement {
  title: string;
  colors: string;
  description: string;
}

function AccessBadge({ title, colors, description, testId }: AccessBadgeProps) {
  const badge = <Badge title={title} colors={colors} testId={testId} />;
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

function Badge({ title, colors, testId }: { title: string; colors: string; testId?: string }) {
  const className = classNames("text-xs font-semibold rounded-full px-2.5 py-1.5", "uppercase cursor-default", colors);

  return (
    <div className={className} data-test-id={testId}>
      {title}
    </div>
  );
}

//
// Permission data
//

interface PermissionData {
  [level: number]: {
    testId: string; // test id for the badge
    title: string; // title of the badge
    colors: string; // color of the badge
    description: {
      project: string; // message shown in the tooltip for project access
      space: string; // message shown in the tooltip for space access
      goal: string; // message shown in the tooltip for goal access
    };
  };
}

const permissionData: PermissionData = {
  [PermissionLevels.FULL_ACCESS]: {
    testId: "full-access-badge",
    title: "Full Access",
    colors: "bg-callout-warning-bg text-callout-warning-content",
    description: {
      project: joinStr(
        "Has full access to the project and can perform any action, ",
        "including editing, commenting, checking-in, closing, and ",
        "archiving the project.",
      ),
      space: "Has full access to all resources in the space, including team and access management.",
      goal: joinStr(
        "Has full access to the goal and can perform any action, ",
        "including editing, commenting, checking-in, closing, and ",
        "archiving the goal.",
      ),
    },
  },

  [PermissionLevels.EDIT_ACCESS]: {
    testId: "edit-access-badge",
    title: "Edit Access",
    colors: "bg-callout-info-bg text-callout-info-content",
    description: {
      project: joinStr(
        "Can edit the project, including its details, tasks, and comments, ",
        "and can check-in. Cannot close or archive the project.",
      ),
      space: joinStr(
        "Can edit the space and its details, add new members, but cannot access ",
        "invite-only projects or change space managers.",
      ),
      goal: "Can edit the goal, including its details and targets.",
    },
  },

  [PermissionLevels.COMMENT_ACCESS]: {
    testId: "comment-access-badge",
    title: "Comment Access",
    colors: "bg-callout-error-bg text-callout-error-content",
    description: {
      project: joinStr(
        "Can comment on the project, including tasks, and check-ins. ",
        "Cannot edit, close, or archive the project.",
      ),
      space: "Can comment all resources in the space, but cannot add or remove members or resources in the space.",
      goal: joinStr(
        "Can comment on the goal updates and discussions. ",
        "Cannot edit, close, or archive the goal.",
      ),
    },
  },

  [PermissionLevels.VIEW_ACCESS]: {
    testId: "view-access-badge",
    title: "View Access",
    colors: "bg-callout-success-bg text-callout-success-content",
    description: {
      project: joinStr(
        "Can view the project, including its details, tasks, and comments. ",
        "Cannot edit, comment, close, or archive the project.",
      ),
      space: "Can view all resources in the space, but cannot edit, comment, or add new resources.",
      goal: joinStr(
        "Can view the goal, including its details and updates. ",
        "Cannot edit, comment, close, or archive the goal.",
      ),
    },
  },

  [PermissionLevels.NO_ACCESS]: {
    testId: "no-access-badge",
    title: "No Access",
    colors: "bg-callout-error-bg text-callout-error-content",
    description: {
      project: "Cannot access the project.",
      space: "Cannot access the space.",
      goal: "Cannot access the goal.",
    },
  },
};
