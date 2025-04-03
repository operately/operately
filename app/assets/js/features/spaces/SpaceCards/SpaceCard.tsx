import * as React from "react";
import * as Spaces from "@/models/spaces";

import classnames from "classnames";

import { Card } from "./Card";
import { PrivacyIndicator } from "@/features/spaces/PrivacyIndicator";
import AvatarList from "@/components/AvatarList";

export interface SpaceCardProps {
  space: Spaces.Space;
  onClick?: () => void;
  shadowSize?: "base" | "lg";
  testId?: string;
  linkTo?: string;
}

export function SpaceCard(props: SpaceCardProps) {
  const { name, mission } = props.space;
  const shadowSize = props.shadowSize ?? "base";

  const className = classnames(
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

  const cardProps = {
    linkTo: props.linkTo,
    testId: props.testId,
    onClick: props.onClick,
  };

  return (
    <Card className={className} title={name!} {...cardProps}>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <div className="font-semibold">{name}</div>
          <PrivacyIndicator space={props.space} size={14} />
        </div>
        <div className="text-content-dimmed text-xs line-clamp-2">{mission}</div>
      </div>

      <AvatarList people={props.space.members!} size={24} maxElements={10} stacked showCutOff={false} />
    </Card>
  );
}
