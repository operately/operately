import React from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { match } from "ts-pattern";
import { IconBuilding, IconLock, IconLockFilled, IconWorld } from "../icons";
import i18n from "../i18n";
import { describeAccess } from "./descriptions";

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
  const { t } = useTranslation();

  return (
    <div className="flex items-center">
      {!props.hideIcon && <AccessIcon {...props} />}
      <div>
        <div className="font-semibold">{calcTitle(props, t)}</div>
        <div className="text-sm">{calcDescription(props, t)}</div>
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

function calcTitle(props: AccessLevelSummaryProps, t: (key: string) => string = (key) => i18n.t(key)) {
  if (props.anonymous >= PERMISSION_LEVELS.VIEW_ACCESS) {
    return t("Public Access");
  }

  if (props.company >= PERMISSION_LEVELS.VIEW_ACCESS) {
    return t("Company-wide Access");
  }

  if (props.resourceType !== "space" && (props.space ?? 0) >= PERMISSION_LEVELS.VIEW_ACCESS) {
    return t("Space-wide Access");
  }

  return t("Invite-only Access");
}

export function calcDescription(props: AccessLevelSummaryProps, t: TFunction = i18n.t.bind(i18n)) {
  const spaceLevel = props.space ?? 0;
  const future = props.tense === "future";

  if (props.anonymous >= PERMISSION_LEVELS.VIEW_ACCESS) {
    const base = describeAccess({ ...props, access: "public" }, t);
    const extra =
      props.company > props.anonymous
        ? match(props.company)
            .with(PERMISSION_LEVELS.COMMENT_ACCESS, () =>
              future
                ? t("Company members will be able to view and comment.")
                : t("Company members can view and comment."),
            )
            .with(PERMISSION_LEVELS.EDIT_ACCESS, () =>
              future ? t("Company members will have edit access.") : t("Company members have edit access."),
            )
            .with(PERMISSION_LEVELS.FULL_ACCESS, () =>
              future ? t("Company members will have full access.") : t("Company members have full access."),
            )
            .otherwise(() => "")
        : "";

    return [base, extra].filter(Boolean).join(" ");
  }

  if (props.company >= PERMISSION_LEVELS.VIEW_ACCESS) {
    const base = match(props.company)
      .with(PERMISSION_LEVELS.VIEW_ACCESS, () => describeAccess({ ...props, access: "company_view" }, t))
      .with(PERMISSION_LEVELS.COMMENT_ACCESS, () => describeAccess({ ...props, access: "company_comment" }, t))
      .with(PERMISSION_LEVELS.EDIT_ACCESS, () => describeAccess({ ...props, access: "company_edit" }, t))
      .with(PERMISSION_LEVELS.FULL_ACCESS, () => describeAccess({ ...props, access: "company_full" }, t))
      .otherwise(() => "");

    const extra =
      props.resourceType !== "space" && spaceLevel > props.company
        ? match(spaceLevel)
            .with(PERMISSION_LEVELS.COMMENT_ACCESS, () =>
              future ? t("Space members will be able to view and comment.") : t("Space members can view and comment."),
            )
            .with(PERMISSION_LEVELS.EDIT_ACCESS, () =>
              future ? t("Space members will have edit access.") : t("Space members have edit access."),
            )
            .with(PERMISSION_LEVELS.FULL_ACCESS, () =>
              future ? t("Space members will have full access.") : t("Space members have full access."),
            )
            .otherwise(() => "")
        : "";

    return [base, extra].filter(Boolean).join(" ");
  }

  if (props.resourceType !== "space" && spaceLevel >= PERMISSION_LEVELS.VIEW_ACCESS) {
    return match(spaceLevel)
      .with(PERMISSION_LEVELS.VIEW_ACCESS, () => describeAccess({ ...props, access: "space_view" }, t))
      .with(PERMISSION_LEVELS.COMMENT_ACCESS, () => describeAccess({ ...props, access: "space_comment" }, t))
      .with(PERMISSION_LEVELS.EDIT_ACCESS, PERMISSION_LEVELS.FULL_ACCESS, () =>
        describeAccess({ ...props, access: "space_edit" }, t),
      )
      .otherwise(() => "");
  }

  return describeAccess({ ...props, access: "invite_only" }, t);
}
