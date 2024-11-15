import React from "react";

import { Space } from "@/models/spaces";
import { ResourceHub } from "@/models/resourceHubs";

import { Paths } from "@/routes/paths";
import { Container, Title, ZeroResourcesContainer } from "./components";
import { assertPresent } from "@/utils/assertions";

interface ResourceHubProps {
  space: Space;
  resourceHub: ResourceHub;
  toolsCount: number;
}

export function ResourceHub({ space, resourceHub, toolsCount }: ResourceHubProps) {
  assertPresent(resourceHub.nodes, "nodes must be present in resourceHub");

  const path = Paths.spaceResourceHubPath(space.id!, resourceHub.id!);

  return (
    <Container path={path} toolsCount={toolsCount} testId="messages-tool">
      <Title title={resourceHub.name!} />
      {resourceHub.nodes.length < 1 ? <ZeroResources /> : <></>}
    </Container>
  );
}

function ZeroResources() {
  return (
    <ZeroResourcesContainer>
      <>
        Nothing here just yet.
        <div className="font-normal text-sm">A place to share rich text documents, images, videos, and other files</div>
      </>
    </ZeroResourcesContainer>
  );
}
