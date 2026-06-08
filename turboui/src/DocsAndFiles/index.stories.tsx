import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { PrimaryButton } from "../Button";
import { MenuActionItem } from "../Menu";
import { IconDots, IconDownload, IconEdit, IconTrash } from "../icons";
import { DocsAndFiles, DocsAndFilesPreview, DocsAndFilesTab } from ".";

const meta: Meta<typeof DocsAndFilesTab> = {
  title: "Components/DocsAndFiles",
  component: DocsAndFilesTab,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-surface-dimmed p-8">
        <div className="mx-auto max-w-5xl rounded-lg border border-surface-outline bg-surface-base shadow-sm">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const items: DocsAndFiles.Item[] = [
  {
    id: "folder-1",
    name: "Customer research",
    type: "folder",
    link: "#",
    insertedAt: "2026-01-04T10:00:00Z",
    updatedAt: "2026-01-04T10:00:00Z",
    details: ["8 items"],
    menu: <ItemMenu />,
  },
  {
    id: "doc-1",
    name: "Launch narrative",
    type: "document",
    link: "#",
    insertedAt: "2026-01-03T10:00:00Z",
    updatedAt: "2026-01-08T10:00:00Z",
    commentsCount: 4,
    details: ["Ada Lovelace", "Positioning, launch goals, and approved messaging"],
    menu: <ItemMenu />,
  },
  {
    id: "file-1",
    name: "Support enablement.pdf",
    type: "file",
    fileKind: "pdf",
    link: "#",
    insertedAt: "2026-01-02T10:00:00Z",
    updatedAt: "2026-01-07T10:00:00Z",
    details: ["Grace Hopper", "428KB"],
    menu: <ItemMenu />,
  },
  {
    id: "link-1",
    name: "Attribution dashboard",
    type: "link",
    link: "#",
    insertedAt: "2026-01-01T10:00:00Z",
    updatedAt: "2026-01-06T10:00:00Z",
    commentsCount: 2,
    details: ["Katherine Johnson"],
    menu: <ItemMenu />,
  },
  {
    id: "file-2",
    name: "Prototype walkthrough.mov",
    type: "file",
    fileKind: "mov",
    link: "#",
    insertedAt: "2025-12-30T10:00:00Z",
    updatedAt: "2026-01-05T10:00:00Z",
    details: ["Alan Turing", "38MB"],
    menu: <ItemMenu />,
  },
  {
    id: "file-3",
    name: "Press kit assets.zip",
    type: "file",
    fileKind: "zip",
    link: "#",
    insertedAt: "2025-12-29T10:00:00Z",
    updatedAt: "2026-01-02T10:00:00Z",
    details: ["Dorothy Vaughan", "12MB"],
    menu: <ItemMenu />,
  },
];

export const Tab: Story = {
  render: () => <DocsAndFilesTab title="Documents & Files" items={items} addAction={<AddButton />} />,
};

export const WithDraftsAndUpload: Story = {
  render: () => (
    <DocsAndFilesTab
      title="Documents & Files"
      items={items}
      addAction={<AddButton />}
      draftPrompt={{ count: 2, link: "#" }}
      uploadForm={
        <div className="my-4 rounded-md border border-surface-outline bg-surface-dimmed p-4">
          <div className="font-medium">Uploading 3 files</div>
          <div className="mt-2 h-2 rounded-full bg-surface-outline">
            <div className="h-2 w-2/3 rounded-full bg-blue-500" />
          </div>
        </div>
      }
    />
  ),
};

export const Empty: Story = {
  render: () => <DocsAndFilesTab title="Documents & Files" items={[]} addAction={<AddButton />} />,
};

export const FolderEmpty: Story = {
  render: () => <DocsAndFilesTab title="Research notes" items={[]} addAction={<AddButton />} emptyStateKind="folder" />,
};

export const Preview: Story = {
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
  render: () => <DocsAndFilesPreview items={items} tabPath="#" />,
};

function AddButton() {
  return (
    <PrimaryButton size="sm" testId="add-options">
      Add
    </PrimaryButton>
  );
}

function ItemMenu() {
  return (
    <PrimaryButton
      size="xxs"
      optionsAlign="end"
      options={[
        <MenuActionItem key="rename" icon={IconEdit} onClick={() => {}}>
          Rename
        </MenuActionItem>,
        <MenuActionItem key="download" icon={IconDownload} onClick={() => {}}>
          Download
        </MenuActionItem>,
        <MenuActionItem key="delete" icon={IconTrash} onClick={() => {}}>
          Delete
        </MenuActionItem>,
      ]}
    >
      <IconDots size={14} />
    </PrimaryButton>
  );
}
