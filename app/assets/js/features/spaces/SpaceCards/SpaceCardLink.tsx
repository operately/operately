import * as React from "react";

import { SpaceCard, SpaceCardProps } from "./SpaceCard";

export function SpaceCardLink(props: SpaceCardProps) {
  return <SpaceCard {...props} linkTo={paths.spacePath(props.space.id!)} />;
}
