import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CuratedTemplateDetailPage } from "./index";
import { templateFixture } from "../mockData";
import type { CuratedTemplate, TemplateType } from "../types";
import type { TemplateDetailProps } from "./types";

export default { title: "Pages/CuratedTemplates/Template", parameters: { layout: "fullscreen" } } satisfies Meta;
type Story = StoryObj;

function EditorStory({ type = "project", failure = false }: { type?: TemplateType; failure?: boolean }) {
  const [template, setTemplate] = React.useState<CuratedTemplate>(templateFixture(type));
  const update = (values: Partial<CuratedTemplate>) => {
    const updated = { ...template, ...values, updatedAt: new Date().toISOString() };
    setTemplate(updated);
    return { template: updated, errors: [] };
  };
  const props: TemplateDetailProps = {
    template,
    catalogPath: "/",
    onSave: async (input, intent) =>
      failure
        ? { errors: [{ path: "definition.name", message: "Example validation error" }] }
        : update({ ...input, state: intent === "publish" ? "published" : "draft" }),
    onCancel: () => {},
    onDelete: async () => {},
  };
  return <CuratedTemplateDetailPage {...props} />;
}

export const ProjectEditor: Story = { render: () => <EditorStory /> };
export const GoalEditor: Story = { render: () => <EditorStory type="goal" /> };
export const KpiEditor: Story = { render: () => <EditorStory type="kpi" /> };
