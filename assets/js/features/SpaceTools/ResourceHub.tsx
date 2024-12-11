import React from "react";

import { ResourceHub, ResourceHubNode } from "@/models/resourceHubs";

import { Paths } from "@/routes/paths";
import { Container, Title, ZeroResourcesContainer } from "./components";
import { assertPresent } from "@/utils/assertions";
import classNames from "classnames";
import { createTestId } from "@/utils/testid";
import { findIcon, findSubtitle, NodeType } from "@/features/ResourceHub";

interface ResourceHubProps {
  resourceHub: ResourceHub;
}

export function ResourceHub({ resourceHub }: ResourceHubProps) {
  assertPresent(resourceHub.nodes, "nodes must be present in resourceHub");

  const testid = createTestId(resourceHub.name!);
  const path = Paths.resourceHubPath(resourceHub.id!);

  return (
    <Container path={path} testId={testid}>
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
  const Icon = findIcon(node.type as NodeType, node);
  const subtitle = findSubtitle(node.type as NodeType, node);

  return (
    <div key={node.id} className={className}>
      <div>
        <Icon size={32} />
      </div>
      <div className="overflow-hidden">
        <div className="font-bold truncate">{node.name}</div>
        <div className="truncate">{subtitle}</div>
      </div>
    </div>
  );
}
