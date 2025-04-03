import React from "react";
import { PermissionLevels } from "@/features/Permissions";
import { match } from "ts-pattern";
import * as Icons from "@tabler/icons-react";

interface AccessLevelProps {
  tense: "present" | "future";

  anonymous: PermissionLevels;
  company: PermissionLevels;

  hideIcon?: boolean;
}

export function AccessLevel(props: AccessLevelProps) {
  return (
    <div className="flex items-center">
      {!props.hideIcon && <Icon {...props} />}
      <div>
        <div className="font-semibold">{calcTitle(props)}</div>
        <div className="text-sm">{calcDescription(props)}</div>
      </div>
    </div>
  );
}

function Icon(props: AccessLevelProps) {
  if (props.anonymous >= PermissionLevels.VIEW_ACCESS) {
    return <Icons.IconWorld className="text-content-accent ml-1.5 mr-3" size={30} strokeWidth={2} />;
  }

  if (props.company >= PermissionLevels.VIEW_ACCESS) {
    return <Icons.IconBuilding className="text-content-accent ml-1.5 mr-3" size={30} strokeWidth={2} />;
  }

  return <Icons.IconLockFilled className="ml-1.5 mr-3 text-callout-error-icon" size={30} strokeWidth={2} />;
}

function calcTitle(props: AccessLevelProps) {
  if (props.anonymous >= PermissionLevels.VIEW_ACCESS) {
    return "Public Access";
  }

  if (props.company >= PermissionLevels.VIEW_ACCESS) {
    return "Company-wide Access";
  }

  return "Invite-only Access";
}

function calcDescription(props: AccessLevelProps) {
  const can = props.tense === "future" ? "will be able to" : "can";
  const have = props.tense === "future" ? "will have" : "have";

  if (props.anonymous >= PermissionLevels.VIEW_ACCESS) {
    let message = `Anyone on the internet ${can} view this space`;

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
      .with(PermissionLevels.VIEW_ACCESS, () => "view this space")
      .with(PermissionLevels.COMMENT_ACCESS, () => "view and comment on this space")
      .with(PermissionLevels.EDIT_ACCESS, () => "view and edit this space")
      .with(PermissionLevels.FULL_ACCESS, () => "view and edit this space")
      .run();

    return message;
  }

  return `Only people you add to the space ${can} view it`;
}
