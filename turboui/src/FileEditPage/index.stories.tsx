import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { FileEditPage } from "./index";
import type { FileEditPage as FileEditPageTypes } from "./types";
import { emptyContent } from "../RichContent/contentOps";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";

const meta = {
  title: "Pages/FileEditPage",
  component: FileEditPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/files/file-1/edit",
      routePath: "/files/:id/edit",
    },
  },
} satisfies Meta<typeof FileEditPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const navigation = [
  { to: "/spaces/space-1", label: "Product" },
  { to: "/resource-hubs/hub-1", label: "Documents & Files" },
  { to: "/files/file-1", label: "Launch photo.jpg" },
];

const initialDescription = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Hero image for the launch campaign." }],
    },
  ],
};

export const Default: Story = {
  args: {} as FileEditPageTypes.Props,
  render: () => (
    <FileEditPage
      pageTitle="Edit File"
      navigation={navigation}
      testId="resource-hub-edit-file-page"
      richTextHandlers={createMockRichEditorHandlers()}
      initialTitle="Launch photo.jpg"
      initialDescription={initialDescription}
      cancelLink="/files/file-1"
      onSubmit={async (values, meta) => {
        console.log("Submit", values, meta);
        return true;
      }}
    />
  ),
};

export const Template: Story = {
  args: {} as FileEditPageTypes.Props,
  parameters: {
    reactRouter: {
      path: "/project-templates/template-1/files/node-1/edit",
      routePath: "/project-templates/:templateId/files/:id/edit",
    },
  },
  render: () => (
    <FileEditPage
      pageTitle={["Edit File", "Launch Playbook"]}
      navigation={[
        { to: "/spaces/space-1", label: "Product" },
        { to: "/spaces/space-1/project-templates", label: "Project Templates" },
        { to: "/project-templates/template-1", label: "Launch Playbook" },
        { to: "/project-templates/template-1?tab=docs-and-files", label: "Docs & Files" },
        { to: "/project-templates/template-1/files/node-1", label: "Launch photo.jpg" },
      ]}
      testId="project-template-edit-file-page"
      richTextHandlers={createMockRichEditorHandlers()}
      initialTitle="Launch photo.jpg"
      initialDescription={emptyContent()}
      cancelLink="/project-templates/template-1/files/node-1"
      onSubmit={async (values, meta) => {
        console.log("Submit", values, meta);
        return true;
      }}
    />
  ),
};
