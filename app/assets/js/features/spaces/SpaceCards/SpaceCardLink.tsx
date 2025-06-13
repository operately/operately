import * as React from "react";

import { SpaceCard, SpaceCardProps } from "./SpaceCard";

import { usePaths } from "@/routes/paths";
export function SpaceCardLink(props: SpaceCardProps) {
  const paths = usePaths();
  return <SpaceCard {...props} linkTo={paths.spacePath(props.space.id!)} />;
}
