import React from "react";
import { useTranslation } from "react-i18next";
import { match } from "ts-pattern";
import { IconBuilding, IconLock, IconLockFilled, IconWorld } from "../icons";
import i18n from "../i18n";

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

export function calcDescription(props: AccessLevelSummaryProps) {
  const t = i18n.t.bind(i18n);
  const resource = props.resourceType;
  const spaceLevel = props.space ?? 0;
  const future = props.tense === "future";

  if (props.anonymous >= PERMISSION_LEVELS.VIEW_ACCESS) {
    const extra =
      props.company > props.anonymous
        ? match(props.company)
            .with(PERMISSION_LEVELS.VIEW_ACCESS, () => "")
            .with(PERMISSION_LEVELS.COMMENT_ACCESS, () =>
              future
                ? t(", company members will be able to view and comment")
                : t(", company members can view and comment"),
            )
            .with(PERMISSION_LEVELS.EDIT_ACCESS, () =>
              future ? t(", company members will be able to edit") : t(", company members can edit"),
            )
            .with(PERMISSION_LEVELS.FULL_ACCESS, () =>
              future ? t(", company members will have full access") : t(", company members have full access"),
            )
            .otherwise(() => "")
        : "";

    const base = future
      ? t("Anyone on the internet will be able to view this {{resource}}", { resource })
      : t("Anyone on the internet can view this {{resource}}", { resource });

    return `${base}${extra}`;
  }

  if (props.company >= PERMISSION_LEVELS.VIEW_ACCESS) {
    const base = match(props.company)
      .with(PERMISSION_LEVELS.VIEW_ACCESS, () =>
        future
          ? t("Everyone in the company will be able to view this {{resource}}", { resource })
          : t("Everyone in the company can view this {{resource}}", { resource }),
      )
      .with(PERMISSION_LEVELS.COMMENT_ACCESS, () =>
        future
          ? t("Everyone in the company will be able to view and comment on this {{resource}}", { resource })
          : t("Everyone in the company can view and comment on this {{resource}}", { resource }),
      )
      .with(PERMISSION_LEVELS.EDIT_ACCESS, () =>
        future
          ? t("Everyone in the company will be able to view and edit this {{resource}}", { resource })
          : t("Everyone in the company can view and edit this {{resource}}", { resource }),
      )
      .with(PERMISSION_LEVELS.FULL_ACCESS, () =>
        future
          ? t("Everyone in the company will have full access to this {{resource}}", { resource })
          : t("Everyone in the company has full access to this {{resource}}", { resource }),
      )
      .otherwise(() => "");

    const extra =
      props.resourceType !== "space" && spaceLevel > props.company
        ? match(spaceLevel)
            .with(PERMISSION_LEVELS.VIEW_ACCESS, () => "")
            .with(PERMISSION_LEVELS.COMMENT_ACCESS, () => t(", space members can view and comment"))
            .with(PERMISSION_LEVELS.EDIT_ACCESS, () => t(", space members can edit"))
            .with(PERMISSION_LEVELS.FULL_ACCESS, () =>
              future ? t(", space members will have full access") : t(", space members have full access"),
            )
            .otherwise(() => "")
        : "";

    return `${base}${extra}`;
  }

  if (props.resourceType !== "space" && spaceLevel >= PERMISSION_LEVELS.VIEW_ACCESS) {
    return match(spaceLevel)
      .with(PERMISSION_LEVELS.VIEW_ACCESS, () =>
        future
          ? t("Everyone in the space will be able to view this {{resource}}", { resource })
          : t("Everyone in the space can view this {{resource}}", { resource }),
      )
      .with(PERMISSION_LEVELS.COMMENT_ACCESS, () =>
        future
          ? t("Everyone in the space will be able to view and comment on this {{resource}}", { resource })
          : t("Everyone in the space can view and comment on this {{resource}}", { resource }),
      )
      .with(PERMISSION_LEVELS.EDIT_ACCESS, () =>
        future
          ? t("Everyone in the space will be able to view and edit this {{resource}}", { resource })
          : t("Everyone in the space can view and edit this {{resource}}", { resource }),
      )
      .with(PERMISSION_LEVELS.FULL_ACCESS, () =>
        future
          ? t("Everyone in the space will be able to view and edit this {{resource}}", { resource })
          : t("Everyone in the space can view and edit this {{resource}}", { resource }),
      )
      .otherwise(() => "");
  }

  return future
    ? t("Only people you add to the {{resource}} will be able to view it", { resource })
    : t("Only people you add to the {{resource}} can view it", { resource });
}
