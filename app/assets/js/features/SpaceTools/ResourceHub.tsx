import * as ResourceHubs from "@/models/resourceHubs";
import * as React from "react";

import { assertPresent } from "@/utils/assertions";
import { createTestId } from "@/utils/testid";

import { Container } from "./components";
import { RegularState } from "./ResourceHubs/RegularState";
import { ZeroState } from "./ResourceHubs/ZeroState";

interface Props {
  resourceHub: ResourceHubs.ResourceHub;
}

export function ResourceHub(props: Props) {
  assertPresent(props.resourceHub.nodes, "nodes must be present in resourceHub");

  const testid = createTestId(props.resourceHub.name!);
  const path = paths.resourceHubPath(props.resourceHub.id!);
  const isZeroState = props.resourceHub.nodes.length < 1;

  return (
    <Container path={path} testId={testid}>
      {isZeroState ? <ZeroState /> : <RegularState {...props} />}
    </Container>
  );
}
