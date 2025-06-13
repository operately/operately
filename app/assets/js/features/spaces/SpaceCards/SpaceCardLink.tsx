import * as React from "react";

import { DeprecatedPaths } from "@/routes/paths";
import { SpaceCard, SpaceCardProps } from "./SpaceCard";

export function SpaceCardLink(props: SpaceCardProps) {
  return <SpaceCard {...props} linkTo={DeprecatedPaths.spacePath(props.space.id!)} />;
}
