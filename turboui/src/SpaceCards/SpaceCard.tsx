import React from "react";

import type { AccessLevels } from "../ApiTypes";
import { AvatarList, type AvatarPerson } from "../Avatar";
import { DivLink } from "../Link";
import { SpacePrivacyIndicator } from "../PrivacyIndicator";
import classNames from "../utils/classnames";

export interface SpaceCardProps {
  name: string;
  mission?: string | null;
  accessLevels?: AccessLevels | null;
  members?: AvatarPerson[];
  linkTo?: string;
  shadowSize?: "base" | "lg";
  testId?: string;
  onClick?: () => void;
}

export function SpaceCard(props: SpaceCardProps) {
  const shadowSize = props.shadowSize ?? "base";

  const className = classNames(
    "flex flex-col gap-4",
    "cursor-pointer",
    "rounded-xl",
    "bg-surface-base",
    "relative",
    "shadow",
    "overflow-hidden",
    "hover:-translate-y-0.5",
    "px-4 py-3",
    {
      "hover:shadow-lg transition-shadow": shadowSize === "base",
      "hover:shadow-xl transition-shadow": shadowSize === "lg",
    },
  );

  const content = (
    <>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <div className="font-semibold">{props.name}</div>
          <SpacePrivacyIndicator accessLevels={props.accessLevels} iconSize={14} />
        </div>
        <div className="text-content-dimmed text-xs line-clamp-2">{props.mission}</div>
      </div>

      <AvatarList people={props.members ?? []} size={24} maxElements={10} stacked showCutOff={false} />
    </>
  );

  if (props.linkTo) {
    return (
      <DivLink to={props.linkTo} className={className} title={props.name} testId={props.testId}>
        {content}
      </DivLink>
    );
  }

  return (
    <div className={className} title={props.name} data-test-id={props.testId} onClick={props.onClick}>
      {content}
    </div>
  );
}
