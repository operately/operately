import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import React from "react";
import { match } from "ts-pattern";
import type { AccessLevels } from "../ApiTypes";
import { Tooltip } from "../Tooltip";
import { IconLockFilled, IconWorld } from "../icons";

const DEFAULT_SIZE = 24;

export function PrivacyIndicator(props: PrivacyIndicator.Props) {
  const { t } = useTranslation();
  props = { ...props, iconSize: props.iconSize ?? DEFAULT_SIZE };

  if (props.privacyLevel === "internal") {
    return null;
  }

  const tooltipContent = (
    <div>
      <div className="text-content-accent font-bold">{title(props, t)}</div>
      <div className="text-content-dimmed mt-1 w-64 text-sm">{description(props, t)}</div>
    </div>
  );

  const icon = match(props.privacyLevel)
    .with("public", () => <IconWorld size={props.iconSize!} />)
    .with("confidential", () => <IconLockFilled size={props.iconSize!} />)
    .with("secret", () => (
      <IconLockFilled
        size={props.iconSize!}
        className={props.resourceType === "space" ? undefined : "text-content-error"}
      />
    ))
    .exhaustive();

  return (
    <Tooltip content={tooltipContent} delayDuration={100} contentClassName={props.className} testId={props.testId}>
      <span data-test-id={props.testId}>{icon}</span>
    </Tooltip>
  );
}

function title(props: PrivacyIndicator.Props, t: TFunction) {
  if (props.privacyLevel === "internal") return null;

  return match(props.privacyLevel)
    .with("public", () => t("Anyone on the internet"))
    .with("confidential", () => t("Only {{spaceName}} members", { spaceName: props.spaceName }))
    .with("secret", () => t("Invite-Only"))
    .exhaustive();
}

function description(props: PrivacyIndicator.Props, t: TFunction) {
  const options = { spaceName: props.spaceName };

  switch (props.resourceType) {
    case "goal":
      return match(props.privacyLevel)
        .with("internal", () => null)
        .with("public", () => t("This goal is visible to anyone on the internet who has the link."))
        .with("confidential", () => t("This goal is visible only to members of the {{spaceName}} space.", options))
        .with("secret", () => t("Only people explicitly invited to this goal can view it."))
        .exhaustive();
    case "project":
      return match(props.privacyLevel)
        .with("internal", () => null)
        .with("public", () => t("This project is visible to anyone on the internet who has the link."))
        .with("confidential", () => t("This project is visible only to members of the {{spaceName}} space.", options))
        .with("secret", () => t("Only people explicitly invited to this project can view it."))
        .exhaustive();
    case "space":
      return match(props.privacyLevel)
        .with("internal", () => null)
        .with("public", () => t("This space is visible to anyone on the internet who has the link."))
        .with("confidential", () => t("This space is visible only to members of the {{spaceName}} space.", options))
        .with("secret", () => t("Only people explicitly invited to this space can view it."))
        .exhaustive();
  }
}

export namespace PrivacyIndicator {
  export const PRIVACY_LEVELS = ["public", "internal", "confidential", "secret"] as const;
  export type PrivacyLevels = (typeof PRIVACY_LEVELS)[number];

  export interface Props {
    privacyLevel: PrivacyLevels;
    resourceType: "goal" | "project" | "space";
    spaceName: string;

    iconSize?: number;
    className?: string;
    testId?: string;
  }
}

export interface SpacePrivacyIndicatorProps {
  accessLevels: AccessLevels | null | undefined;
  iconSize?: number;
  className?: string;
}

export function SpacePrivacyIndicator({ accessLevels, iconSize, className }: SpacePrivacyIndicatorProps) {
  const privacyLevel = privacyLevelFromAccessLevels(accessLevels);

  if (!privacyLevel || privacyLevel === "internal") {
    return null;
  }

  return (
    <PrivacyIndicator
      privacyLevel={privacyLevel}
      resourceType="space"
      spaceName=""
      iconSize={iconSize}
      className={className}
      testId={privacyLevel === "public" ? "public-space-tooltip" : "secret-space-tooltip"}
    />
  );
}

function privacyLevelFromAccessLevels(
  accessLevels: AccessLevels | null | undefined,
): PrivacyIndicator.PrivacyLevels | null {
  if (!accessLevels) {
    return null;
  }

  if ((accessLevels.public ?? 0) > 0) {
    return "public";
  }

  if ((accessLevels.company ?? 0) > 0) {
    return "internal";
  }

  return "secret";
}
