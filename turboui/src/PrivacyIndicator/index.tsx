import React from "react";
import { match } from "ts-pattern";
import type { AccessLevels } from "../ApiTypes";
import { Tooltip } from "../Tooltip";
import { IconLockFilled, IconWorld } from "../icons";

const DEFAULT_SIZE = 24;

export function PrivacyIndicator(props: PrivacyIndicator.Props) {
  props = { ...props, iconSize: props.iconSize ?? DEFAULT_SIZE };

  if (props.privacyLevel === "internal") {
    return null;
  }

  const tooltipContent = (
    <div>
      <div className="text-content-accent font-bold">{title(props)}</div>
      <div className="text-content-dimmed mt-1 w-64 text-sm">{description(props)}</div>
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

function title(props: PrivacyIndicator.Props) {
  if (props.privacyLevel === "internal") return null;

  return match(props.privacyLevel)
    .with("public", () => "Anyone on the internet")
    .with("confidential", () => `Only ${props.spaceName} members`)
    .with("secret", () => `Invite-Only`)
    .exhaustive();
}

function description(props: PrivacyIndicator.Props) {
  if (props.privacyLevel === "internal") return null;

  const t = props.resourceType;
  const s = props.spaceName;

  return match(props.privacyLevel)
    .with("public", () => `This ${t} is visible to anyone on the internet who has the link.`)
    .with("confidential", () => `This ${t} is visible only to members of the ${s} space.`)
    .with("secret", () => `Only people explicitly invited to this ${t} can view it.`)
    .exhaustive();
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
