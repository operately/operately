import React from "react";

import { ResourceHub, ResourceHubNode } from "@/models/resourceHubs";

import { Paths } from "@/routes/paths";
import { Container, Title, ZeroResourcesContainer } from "./components";
import { assertPresent } from "@/utils/assertions";
import classNames from "classnames";
import { createTestId } from "@/utils/testid";
import { findIcon, findSubtitle, NodeType } from "@/features/ResourceHub";
import { GhostButton } from "@/components/Buttons";

interface ResourceHubProps {
  resourceHub: ResourceHub;
}

export function ResourceHub({ resourceHub }: ResourceHubProps) {
  assertPresent(resourceHub.nodes, "nodes must be present in resourceHub");

  const testid = createTestId(resourceHub.name!);
  const path = Paths.resourceHubPath(resourceHub.id!);

  return (
    <Container path={path} testId={testid}>
      <div className="flex flex-col items-center justify-center w-full mt-8">
        <img
          src="https://notioly.com/wp-content/uploads/2024/03/365.Archive-Files.png"
          width="170px"
          height="170px"
          alt="Goals and Projects"
        />

        <div className="text-base font-bold mt-4">Documents &amp; Files</div>

        <div className="flex gap-2 mt-1 mb-4 text-center px-6 text-sm">
          A place to share rich text documents, images, videos, and other files
        </div>

        <GhostButton size="sm" linkTo={"/"} testId="edit-space">
          Add doc &amp; file
        </GhostButton>
      </div>
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
