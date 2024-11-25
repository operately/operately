import React from "react";

import { ResourceHub, ResourceHubNode } from "@/models/resourceHubs";

import { Paths } from "@/routes/paths";
import { Container, Title, ZeroResourcesContainer } from "./components";
import { assertPresent } from "@/utils/assertions";
import classNames from "classnames";
import { IconFolder } from "@tabler/icons-react";

interface ResourceHubProps {
  resourceHub: ResourceHub;
  toolsCount: number;
}

export function ResourceHub({ resourceHub }: ResourceHubProps) {
  assertPresent(resourceHub.nodes, "nodes must be present in resourceHub");

  const path = Paths.resourceHubPath(resourceHub.id!);

  return (
    <Container path={path} testId="messages-tool">
      <Title title={resourceHub.name!} />
      {resourceHub.nodes.length < 1 ? <ZeroResources /> : <NodesList nodes={resourceHub.nodes} />}
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

function NodesList({ nodes }: { nodes: ResourceHubNode[] }) {
  return (
    <div>
      {nodes.map((node) => (
        <NodeItem key={node.id} node={node} />
      ))}
    </div>
  );
}

function NodeItem({ node }: { node: ResourceHubNode }) {
  const className = classNames("flex gap-2 p-2", "border-b border-stroke-base last:border-b-0");

  return (
    <div key={node.id} className={className}>
      <div>
        <IconFolder size={32} />
      </div>
      <div className="overflow-hidden">
        <div className="font-bold truncate">{node.name}</div>
        <div className="truncate">3 items</div>
      </div>
    </div>
  );
}
