import React from "react";

import { Space } from "@/models/spaces";
import { Discussion } from "@/models/discussions";
import { Paths } from "@/routes/paths";
import { Container } from "./components";
import { ZeroState } from "./Discussions/ZeroState";
import { RegularState } from "./Discussions/RegularState";

interface Props {
  space: Space;
  discussions: Discussion[];
}

export function Discussions(props: Props) {
  const path = Paths.discussionsPath(props.space.id!);
  const isZeroState = props.discussions.length < 1;

  return (
    <Container path={path} testId="messages-tool">
      {isZeroState ? <ZeroState /> : <RegularState {...props} />}
    </Container>
  );
}
