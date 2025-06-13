import * as React from "react";

import { SpaceCard, SpaceCardProps } from "./SpaceCard";

export function SpaceCardLink(props: SpaceCardProps) {
  return <SpaceCard {...props} linkTo={DeprecatedPaths.spacePath(props.space.id!)} />;
}
