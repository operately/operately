import * as React from "react";
import * as Spaces from "@/models/spaces";
import * as Icons from "@tabler/icons-react";

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
  const { name, mission, color, icon } = props.space;
  const iconElement = Icons[icon!];
  const shadowSize = props.shadowSize ?? "base";

  const className = classnames(
    "flex flex-col",
    "cursor-pointer",
    "rounded-xl",
    "bg-surface-base",
    "relative",
    "shadow",
    "overflow-hidden",
    "hover:-translate-y-0.5",
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
      <div className="flex gap-2 items-start flex-1">
        <div className="px-4 py-3 flex-1">
          <div className="flex items-center gap-1.5 mt-1">
            <div className="font-semibold">{name}</div>
            <PrivacyIndicator space={props.space} size={14} />
          </div>
          <div className="text-content-dimmed text-sm line-clamp-2">{mission}</div>
        </div>
      </div>

      <div className="px-4 py-3 flex items-center justify-between">
        <AvatarList people={props.space.members!} size={24} maxElements={10} stacked showCutOff={false} />

        <div className="">{React.createElement(iconElement, { size: 24, className: color, strokeSize: 1 })}</div>
      </div>
    </Card>
  );
}
