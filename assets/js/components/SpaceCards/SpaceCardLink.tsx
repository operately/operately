import * as React from "react";

import { SpaceCard, SpaceCardProps } from "./SpaceCard";

export function SpaceCardLink(props: SpaceCardProps) {
  return <SpaceCard {...props} linkTo={`/spaces/${props.group.id}`} />;
}
