import React from "react";

import { ResourceHubNode } from "@/models/resourceHubs";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { IconFile, IconFolder } from "@tabler/icons-react";
import { Paths } from "@/routes/paths";
import { useLoadedData, useRefresh } from "./loader";
import { AddFilesButtonAndForms } from "./AddNewFiles";
import { assertPresent } from "@/utils/assertions";
import classNames from "classnames";

export function Page() {
  const { resourceHub } = useLoadedData();
  const refresh = useRefresh();

  assertPresent(resourceHub.nodes, "nodes must be present in resourceHub");

  return (
    <Pages.Page title={resourceHub.name!}>
      <Paper.Root>
        <PageNavigation />

        <Paper.Body minHeight="75vh">
          <Paper.Header
            actions={<AddFilesButtonAndForms resourceHub={resourceHub} refresh={refresh} />}
            title={resourceHub.name!}
            layout="title-center-actions-left"
          />

          {resourceHub.nodes.length < 1 ? <ZeroNodes /> : <NodesList nodes={resourceHub.nodes} />}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageNavigation() {
  const { space } = useLoadedData();

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spacePath(space.id!)}>{space.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}

function ZeroNodes() {
  return (
    <div className="border border-dashed border-stroke-base p-4 w-[500px] mx-auto mt-12 flex gap-4">
      <IconFile size={48} className="text-gray-600" />
      <div>
        <div className="font-bold">Nothing here just yet.</div>A place to share rich text documents, images, videos, and
        other files.
      </div>
    </div>
  );
}

function NodesList({ nodes }: { nodes: ResourceHubNode[] }) {
  return (
    <div className="mt-12">
      {nodes.map((node) => (
        <NodeItem node={node} key={node.id} />
      ))}
    </div>
  );
}

function NodeItem({ node }: { node: ResourceHubNode }) {
  const className = classNames(
    "flex gap-4 py-4",
    "cursor-pointer hover:bg-surface-accent",
    "border-b border-stroke-base first:border-t last:border-b-0",
  );

  return (
    <div className={className}>
      <IconFolder size={48} />
      <div>
        <div className="font-bold text-lg">{node.name}</div>
        <div>3 items</div>
      </div>
    </div>
  );
}
