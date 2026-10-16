import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CuratedTemplateDetailPage } from "./index";
import { defaultFormattedTimePreferences } from "../../FormattedTime";
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
    editing: true,
    formattedTimePreferences: defaultFormattedTimePreferences,
    catalogPath: "/",
    onSave: async (input, intent) =>
      failure
        ? { errors: [{ path: "definition.name", message: "Example validation error" }] }
        : update({ ...input, state: intent === "publish" ? "published" : "draft" }),
    onCancel: () => {},
    onSavePreviewData: async (previewData) => update({ previewData }),
    onDelete: async () => {},
  };
  return <CuratedTemplateDetailPage {...props} />;
}

export const ProjectEditor: Story = { render: () => <EditorStory /> };
export const GoalEditor: Story = { render: () => <EditorStory type="goal" /> };
export const KpiEditor: Story = { render: () => <EditorStory type="kpi" /> };

function ReadStory({ type }: { type: TemplateType }) {
  const template = templateFixture(type);
  return (
    <CuratedTemplateDetailPage
      template={{
        ...template,
        previewData: JSON.stringify({
          entries: [
            { period_offset: -2, value: 12500 },
            { period_offset: -1, value: 14200 },
          ],
          annotations: [{ period_offset: -1, title: "Campaign launch" }],
        }),
      }}
      catalogPath="/"
      editPath="/edit"
      previewPath="/preview"
      formattedTimePreferences={defaultFormattedTimePreferences}
      onSave={async () => ({ errors: [] })}
      onCancel={() => {}}
      onDelete={async () => {}}
    />
  );
}

export const ProjectDetails: Story = { render: () => <ReadStory type="project" /> };
export const GoalDetails: Story = { render: () => <ReadStory type="goal" /> };
export const KpiDetails: Story = { render: () => <ReadStory type="kpi" /> };
