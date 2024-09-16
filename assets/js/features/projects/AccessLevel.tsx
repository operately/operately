import React from "react";
import { PermissionLevels } from "@/features/Permissions";
import { match } from "ts-pattern";
import * as Icons from "@tabler/icons-react";

interface AccessLevelProps {
  tense: "present" | "future";

  annonymous: PermissionLevels;
  company: PermissionLevels;
  space: PermissionLevels;

  hideIcon?: boolean;
}

export function AccessLevel(props: AccessLevelProps) {
  return (
    <div className="flex items-center py-2">
      {!props.hideIcon && <Icon {...props} />}
      <div>
        <div className="font-semibold">{calcTitle(props)}</div>
        <div className="text-sm">{calcDescription(props)}</div>
      </div>
    </div>
  );
}

function Icon(props: AccessLevelProps) {
  if (props.annonymous >= PermissionLevels.VIEW_ACCESS) {
    return <Icons.IconGlobe className="text-content-accent ml-1.5 mr-3" size={30} strokeWidth={2} />;
  }

  if (props.company >= PermissionLevels.VIEW_ACCESS) {
    return <Icons.IconBuilding className="text-content-accent ml-1.5 mr-3" size={30} strokeWidth={2} />;
  }

  if (props.space >= PermissionLevels.VIEW_ACCESS) {
    return <Icons.IconLock className="text-content-accent ml-1.5 mr-3" size={30} strokeWidth={2} />;
  }

  return <Icons.IconLockFilled className="ml-1.5 mr-3 text-callout-error-icon" size={30} strokeWidth={2} />;
}

function calcTitle(props: AccessLevelProps) {
  if (props.annonymous >= PermissionLevels.VIEW_ACCESS) {
    return "Public Access";
  }

  if (props.company >= PermissionLevels.VIEW_ACCESS) {
    return "Company-wide Access";
  }

  if (props.space >= PermissionLevels.VIEW_ACCESS) {
    return "Space-wide Access";
  }

  return "Invite-only Access";
}

function calcDescription(props: AccessLevelProps) {
  const can = props.tense === "future" ? "will be able to" : "can";
  const have = props.tense === "future" ? "will have" : "have";

  if (props.annonymous >= PermissionLevels.VIEW_ACCESS) {
    let message = `Anyone on the internet ${can} view this project`;

    if (props.company > props.company) {
      message += match(props.company)
        .with(PermissionLevels.VIEW_ACCESS, () => "")
        .with(PermissionLevels.COMMENT_ACCESS, () => ", company members can view and comment")
        .with(PermissionLevels.EDIT_ACCESS, () => ", company members can edit")
        .with(PermissionLevels.FULL_ACCESS, () => `, company members have ${have} full access`)
        .run();
    }

    return message;
  }

  if (props.company >= PermissionLevels.VIEW_ACCESS) {
    let message = `Everyone in the company ${can} `;

    message += match(props.company)
      .with(PermissionLevels.VIEW_ACCESS, () => "view this project")
      .with(PermissionLevels.COMMENT_ACCESS, () => "view and comment on this project")
      .with(PermissionLevels.EDIT_ACCESS, () => "view and edit this project")
      .with(PermissionLevels.FULL_ACCESS, () => "view and edit this project")
      .run();

    if (props.space > props.company) {
      message += match(props.space)
        .with(PermissionLevels.VIEW_ACCESS, () => "")
        .with(PermissionLevels.COMMENT_ACCESS, () => ", space members can view and comment")
        .with(PermissionLevels.EDIT_ACCESS, () => ", space members can edit")
        .with(PermissionLevels.FULL_ACCESS, () => `, space members ${have} full access`)
        .run();
    }

    return message;
  }

  if (props.space >= PermissionLevels.VIEW_ACCESS) {
    let message = `Everyone in the space ${can} `;

    message += match(props.space)
      .with(PermissionLevels.VIEW_ACCESS, () => "view this project")
      .with(PermissionLevels.COMMENT_ACCESS, () => "view and comment on this project")
      .with(PermissionLevels.EDIT_ACCESS, () => "view and edit this project")
      .with(PermissionLevels.FULL_ACCESS, () => "view and edit this project")
      .run();

    return message;
  }

  return `Only people you add to the project ${can} access it`;
}
