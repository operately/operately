import * as React from "react";

import { SpaceCard, SpaceCardProps } from "./SpaceCard";
import { Paths } from "@/routes/paths";

export function SpaceCardLink(props: SpaceCardProps) {
  return <SpaceCard {...props} linkTo={Paths.spacePath(props.space.id!)} />;
}
