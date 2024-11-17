import React from "react";

import { ResourceHubNode } from "@/models/resourceHubs";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { IconFile, IconFolder, IconUpload } from "@tabler/icons-react";
import { Paths } from "@/routes/paths";
import { useLoadedData } from "./loader";
import { OptionsButton } from "@/components/Buttons";

export function Page() {
  const { nodes } = useLoadedData();

  return (
    <Pages.Page title="Resource Hub">
      <Paper.Root size="large">
        <PageNavigation />

        <Paper.Body minHeight="75vh">
          <Header />
          {nodes.length < 1 ? <ZeroNodes /> : <NodesList nodes={nodes} />}
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

function Header() {
  return (
    <div className="relative text-content-accent text-center text-3xl font-extrabold">
      Resource Hub
      <NewFileButton />
    </div>
  );
}

function NewFileButton() {
  return (
    <div className="absolute top-0 left-0 text-base font-normal">
      <OptionsButton
        align="start"
        options={[
          { icon: IconFile, label: "Write a new document", action: () => {}, testId: "new-document" },
          { icon: IconFolder, label: "Create a new folder", action: () => {}, testId: "new-folder" },
          { icon: IconUpload, label: "Upload files", action: () => {}, testId: "upload-files" },
        ]}
        testId="add-options"
      />
    </div>
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

function NodesList({}: { nodes: ResourceHubNode[] }) {
  return <></>;
}
