import type { Meta, StoryObj } from "@storybook/react-vite";
import { defaultFormattedTimePreferences } from "../../FormattedTime";
import { templateFixture } from "../mockData";
import { CuratedTemplatePreviewPage } from "./index";

export default {
  title: "Pages/CuratedTemplates/Preview",
  component: CuratedTemplatePreviewPage,
  parameters: { layout: "fullscreen" },
  args: { editorPath: "/", referenceDate: "2026-10-12", formattedTimePreferences: defaultFormattedTimePreferences },
} satisfies Meta<typeof CuratedTemplatePreviewPage>;
type Story = StoryObj<typeof CuratedTemplatePreviewPage>;

export const Project: Story = { args: { template: templateFixture("project") } };
export const Goal: Story = { args: { template: templateFixture("goal") } };
export const Kpi: Story = { args: { template: templateFixture("kpi") } };
export const KpiWithExampleData: Story = {
  args: {
    template: {
      ...templateFixture("kpi"),
      previewData: JSON.stringify({
        entries: [
          { period_offset: -3, value: 300 },
          { period_offset: -2, value: 345 },
          { period_offset: -1, value: 416 },
        ],
        annotations: [{ period_offset: -2, title: "Campaign launch" }],
      }),
    },
  },
};
export const IncompleteDraft: Story = { args: { template: { ...templateFixture("kpi"), definition: "{}" } } };
