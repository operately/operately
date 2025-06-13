import React from "react";

import { Discussion } from "@/models/discussions";
import { Space } from "@/models/spaces";
import { Container } from "./components";
import { RegularState } from "./Discussions/RegularState";
import { ZeroState } from "./Discussions/ZeroState";

interface Props {
  space: Space;
  discussions: Discussion[];
}

export function Discussions(props: Props) {
  const path = paths.discussionsPath(props.space.id!);
  const isZeroState = props.discussions.length < 1;

  return (
    <Container path={path} testId="messages-tool">
      {isZeroState ? <ZeroState /> : <RegularState {...props} />}
    </Container>
  );
}
