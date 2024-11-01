import * as React from "react";
import * as Spaces from "@/models/spaces";
import * as Icons from "@tabler/icons-react";

import classnames from "classnames";

import { Card } from "./Card";
import { PrivacyIndicator } from "@/features/spaces/PrivacyIndicator";
import Avatar from "@/components/Avatar";

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
    "rounded-xl",
    "bg-surface-base",
    "border border-surface-outline",
    "relative",
    "shadow-lg",
    {
      "hover:shadow-xl transition-shadow": shadowSize === "base",
      "hover:shadow-2xl transition-shadow": shadowSize === "lg",
    },
  );

  const cardProps = {
    linkTo: props.linkTo,
    testId: props.testId,
    onClick: props.onClick,
  };

  return (
    <Card className={className} title={name!} {...cardProps}>
      <div className="flex gap-2 mb-4 items-start">
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 mt-2">
            <div className="font-semibold">{name}</div>
            <PrivacyIndicator space={props.space} size={14} />
          </div>
          <div className="text-content-dimmed text-sm line-clamp-2">{mission}</div>
        </div>

        <div className="border-l border-b border-stroke-base rounded-bl-lg rounded-tr-xl p-2 bg-surface-dimmed">
          {React.createElement(iconElement, { size: 24, className: color })}
        </div>
      </div>

      <div className="bg-surface-dimmed px-4 py-2 mt-4 mb-2">
        <PeopleList space={props.space} />
      </div>
    </Card>
  );
}

function PeopleList({ space }: { space: Spaces.Space }) {
  const members = space.members!.slice(0, 8);

  return (
    <div className="text-sm text-content-dimmed flex items-center -space-x-1">
      {members!.map((a) => (
        <div className="border border-surface-base rounded-full flex items-center" key={a.id}>
          <Avatar key={a.id} person={a} size={24} />
        </div>
      ))}
    </div>
  );
}
