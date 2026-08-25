import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { TemplateDiscussionForm } from "./index";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";

const meta = {
  title: "Pages/TemplateDiscussionForm",
  component: TemplateDiscussionForm,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/project-templates/template-1/discussions/new",
      routePath: "/project-templates/:templateId/discussions/new",
    },
  },
} satisfies Meta<typeof TemplateDiscussionForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewDiscussion: Story = {
  args: {} as TemplateDiscussionForm.Props,
  render: () => (
    <TemplateDiscussionForm
      pageTitle={["New Discussion", "Launch Playbook"]}
      navigation={[
        { to: "/spaces/space-1", label: "Product" },
        { to: "/spaces/space-1/project-templates", label: "Project Templates" },
        { to: "/project-templates/template-1", label: "Launch Playbook" },
        { to: "/project-templates/template-1?tab=discussions", label: "Discussions" },
      ]}
      richTextHandlers={createMockRichEditorHandlers()}
      cancelLink="/project-templates/template-1?tab=discussions"
      submitLabel="Post Discussion"
      onSubmit={async (values) => {
        console.log("Submit", values);
        return true;
      }}
    />
  ),
};
