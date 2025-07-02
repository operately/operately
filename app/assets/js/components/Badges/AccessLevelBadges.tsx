import React from "react";
import { Tooltip } from "@/components/Tooltip";
import { PermissionLevels } from "@/features/Permissions";
import { joinStr } from "@/utils/strings";
import classNames from "classnames";
import { assertPresent } from "@/utils/assertions";
import { TestableElement } from "@/utils/testid";

// Public interface

export function ProjectAccessLevelBadge({ accessLevel }: { accessLevel: PermissionLevels }) {
  const data = permissionData[accessLevel];
  assertPresent(data, `Invalid access level: ${accessLevel}`);

  return <AccessBadge title={data.title} colors={data.colors} description={data.description.project} />;
}

export function SpaceAccessLevelBadge({ accessLevel }: { accessLevel: PermissionLevels }) {
  const data = permissionData[accessLevel];
  assertPresent(data, `Invalid access level: ${accessLevel}`);

  return (
    <AccessBadge title={data.title} colors={data.colors} description={data.description.space} testId={data.testId} />
  );
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
    },
  },
};
