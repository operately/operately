import * as React from "react";
import * as Spaces from "@/models/spaces";
import * as Icons from "@tabler/icons-react";

import classnames from "classnames";

import { Card } from "./Card";
import { PrivacyIndicator } from "@/features/spaces/PrivacyIndicator";

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
    "cursor-pointer",
    "rounded-lg",
    "bg-surface",
    "px-4 py-3 w-64",
    "border border-surface-outline",
    "relative",
    {
      "hover:shadow transition-shadow": shadowSize === "base",
      "hover:shadow-lg transition-shadow": shadowSize === "lg",
    },
  );

  const cardProps = {
    linkTo: props.linkTo,
    testId: props.testId,
    onClick: props.onClick,
  };

  return (
    <Card className={className} title={name!} {...cardProps}>
      <div className="mt-2"></div>
      {React.createElement(iconElement, { size: 40, className: color, strokeWidth: 1 })}

      <div className="flex items-center gap-1.5 mt-2">
        <div className="font-semibold">{name}</div>
        <PrivacyIndicator space={props.space} size={14} />
      </div>

      <div className="text-content-dimmed text-xs line-clamp-3">{mission}</div>
    </Card>
  );
}
