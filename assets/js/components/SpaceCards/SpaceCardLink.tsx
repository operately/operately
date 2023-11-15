import * as React from "react";

import { SpaceCard, SpaceCardProps } from "./SpaceCard";

export function SpaceCardLink(props: SpaceCardProps) {
  if (props.commingSoon) {
    return <SpaceCard {...props} linkTo={`/`} />;
  } else {
    return <SpaceCard {...props} linkTo={`/spaces/${props.group.id}`} />;
  }
}
