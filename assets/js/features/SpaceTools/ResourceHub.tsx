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
      <div className="group">
        <div className="relative w-full h-[180px] mx-[115px] mt-8 opacity-75">
          <DocExample className="absolute top-2 left-8 rotate-12 group-hover:left-14 group-hover:rotate-[15deg]" />
          <DocExample className="absolute top-0 group-hover:-top-2" />
          <DocExample className="absolute top-2 -left-8 -rotate-12 group-hover:-left-14 group-hover:rotate-[-15deg]" />
        </div>

        <div className="flex flex-col justify-center items-center group">
          <div className="text-base font-bold">Documents &amp; Files</div>

          <div className="flex gap-2 mt-1 mb-4 text-center px-6 text-sm">
            A place to share rich text documents, images, videos, and other files
          </div>

          <GhostButton size="sm" linkTo={"/"} testId="edit-space">
            Add a document or file
          </GhostButton>
        </div>
      </div>
    </Container>
  );
}

function DocExample({ className }: { className: string }) {
  const klass = classNames(
    "absolute bg-surface-base border border-stone-300 dark:border-stone-500 shadow-sm",
    "rounded-sm p-2 h-[140px] w-[100px] overflow-hidden transition-all",
    className,
  );

  return (
    <div className={klass}>
      <div className="font-bold mb-2 text-[6px]" style={{ lineHeight: 1 }}>
        Example report document
      </div>

      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-1"></div>
    </div>
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
