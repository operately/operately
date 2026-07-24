import React from "react";
import { match } from "ts-pattern";
import { IconBuilding, IconLock, IconLockFilled, IconWorld } from "../icons";

const PERMISSION_LEVELS = {
  FULL_ACCESS: 100,
  EDIT_ACCESS: 70,
  COMMENT_ACCESS: 40,
  VIEW_ACCESS: 10,
  NO_ACCESS: 0,
} as const;

export interface AccessLevelSummaryProps {
  resourceType: "project" | "goal" | "space";
  tense: "present" | "future";
  anonymous: number;
  company: number;
  space?: number;
  hideIcon?: boolean;
}

export function AccessLevelSummary(props: AccessLevelSummaryProps) {
  return (
    <div className="flex items-center">
      {!props.hideIcon && <AccessIcon {...props} />}
      <div>
        <div className="font-semibold">{calcTitle(props)}</div>
        <div className="text-sm">{calcDescription(props)}</div>
      </div>
    </div>
  );
}

function AccessIcon(props: AccessLevelSummaryProps) {
  if (props.anonymous >= PERMISSION_LEVELS.VIEW_ACCESS) {
    return <IconWorld className="text-content-accent ml-1.5 mr-3" size={30} strokeWidth={2} />;
  }

  if (props.company >= PERMISSION_LEVELS.VIEW_ACCESS) {
    return <IconBuilding className="text-content-accent ml-1.5 mr-3" size={30} strokeWidth={2} />;
  }

  if (props.resourceType !== "space" && (props.space ?? 0) >= PERMISSION_LEVELS.VIEW_ACCESS) {
    return <IconLock className="text-content-accent ml-1.5 mr-3" size={30} strokeWidth={2} />;
  }

  return <IconLockFilled className="ml-1.5 mr-3 text-callout-error-content" size={30} strokeWidth={2} />;
}

function calcTitle(props: AccessLevelSummaryProps) {
  if (props.anonymous >= PERMISSION_LEVELS.VIEW_ACCESS) {
    return "Public Access";
  }

  if (props.company >= PERMISSION_LEVELS.VIEW_ACCESS) {
    return "Company-wide Access";
  }

  if (props.resourceType !== "space" && (props.space ?? 0) >= PERMISSION_LEVELS.VIEW_ACCESS) {
    return "Space-wide Access";
  }

  return "Invite-only Access";
}

export function calcDescription(props: AccessLevelSummaryProps) {
  const can = props.tense === "future" ? "will be able to" : "can";
  const resource = props.resourceType;
  const spaceLevel = props.space ?? 0;

  if (props.anonymous >= PERMISSION_LEVELS.VIEW_ACCESS) {
    let message = `Anyone on the internet ${can} view this ${resource}`;
    const have = props.tense === "future" ? "will have" : "have";

    if (props.company > props.anonymous) {
      message += match(props.company)
        .with(PERMISSION_LEVELS.VIEW_ACCESS, () => "")
        .with(PERMISSION_LEVELS.COMMENT_ACCESS, () => `, company members ${can} view and comment`)
        .with(PERMISSION_LEVELS.EDIT_ACCESS, () => `, company members ${can} edit`)
        .with(PERMISSION_LEVELS.FULL_ACCESS, () => `, company members ${have} full access`)
        .otherwise(() => "");
    }

    return message;
  }

  if (props.company >= PERMISSION_LEVELS.VIEW_ACCESS) {
    let message = `Everyone in the company `;
    const have = props.tense === "future" ? "will have" : "has";

    message += match(props.company)
      .with(PERMISSION_LEVELS.VIEW_ACCESS, () => `${can} view this ${resource}`)
      .with(PERMISSION_LEVELS.COMMENT_ACCESS, () => `${can} view and comment on this ${resource}`)
      .with(PERMISSION_LEVELS.EDIT_ACCESS, () => `${can} view and edit this ${resource}`)
      .with(PERMISSION_LEVELS.FULL_ACCESS, () => `${have} full access to this ${resource}`)
      .otherwise(() => "");

    if (props.resourceType !== "space" && spaceLevel > props.company) {
      const spaceHave = props.tense === "future" ? "will have" : "have";

      message += match(spaceLevel)
        .with(PERMISSION_LEVELS.VIEW_ACCESS, () => "")
        .with(PERMISSION_LEVELS.COMMENT_ACCESS, () => ", space members can view and comment")
        .with(PERMISSION_LEVELS.EDIT_ACCESS, () => ", space members can edit")
        .with(PERMISSION_LEVELS.FULL_ACCESS, () => `, space members ${spaceHave} full access`)
        .otherwise(() => "");
    }

    return message;
  }

  if (props.resourceType !== "space" && spaceLevel >= PERMISSION_LEVELS.VIEW_ACCESS) {
    let message = `Everyone in the space ${can} `;

    message += match(spaceLevel)
      .with(PERMISSION_LEVELS.VIEW_ACCESS, () => `view this ${resource}`)
      .with(PERMISSION_LEVELS.COMMENT_ACCESS, () => `view and comment on this ${resource}`)
      .with(PERMISSION_LEVELS.EDIT_ACCESS, () => `view and edit this ${resource}`)
      .with(PERMISSION_LEVELS.FULL_ACCESS, () => `view and edit this ${resource}`)
      .otherwise(() => "");

    return message;
  }

  return `Only people you add to the ${resource} ${can} view it`;
}
