import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { LinkEditPage } from "./index";
import type { LinkEditPage as LinkEditPageTypes } from "./types";
import { emptyContent } from "../RichContent/contentOps";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";

const meta = {
  title: "Pages/LinkEditPage",
  component: LinkEditPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/links/link-1/edit",
      routePath: "/links/:id/edit",
    },
  },
} satisfies Meta<typeof LinkEditPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const navigation = [
  { to: "/spaces/space-1", label: "Product" },
  { to: "/resource-hubs/hub-1", label: "Documents & Files" },
  { to: "/links/link-1", label: "Design Spec" },
];

const initialDescription = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Shared design reference for the launch." }],
    },
  ],
};

export const Default: Story = {
  args: {} as LinkEditPageTypes.Props,
  render: () => (
    <LinkEditPage
      pageTitle="Edit Link"
      navigation={navigation}
      testId="resource-hub-edit-link-page"
      richTextHandlers={createMockRichEditorHandlers()}
      initialTitle="Design Spec"
      initialUrl="https://www.figma.com/file/example"
      initialDescription={initialDescription}
      cancelLink="/links/link-1"
      onSubmit={async (values, meta) => {
        console.log("Submit", values, meta);
        return true;
      }}
    />
  ),
};

export const Template: Story = {
  args: {} as LinkEditPageTypes.Props,
  parameters: {
    reactRouter: {
      path: "/project-templates/template-1/links/node-1/edit",
      routePath: "/project-templates/:templateId/links/:id/edit",
    },
  },
  render: () => (
    <LinkEditPage
      pageTitle={["Edit Link", "Launch Playbook"]}
      navigation={[
        { to: "/spaces/space-1", label: "Product" },
        { to: "/spaces/space-1/project-templates", label: "Project Templates" },
        { to: "/project-templates/template-1", label: "Launch Playbook" },
        { to: "/project-templates/template-1?tab=docs-and-files", label: "Docs & Files" },
      ]}
      testId="project-template-edit-link-page"
      richTextHandlers={createMockRichEditorHandlers()}
      initialTitle="Design Spec"
      initialUrl="https://www.figma.com/file/example"
      initialDescription={emptyContent()}
      cancelLink="/project-templates/template-1?tab=docs-and-files"
      onSubmit={async (values, meta) => {
        console.log("Submit", values, meta);
        return true;
      }}
    />
  ),
};
