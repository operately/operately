import type { Meta, StoryObj } from "@storybook/react";
import { CuratedTemplateUsePage } from ".";

const meta = {
  title: "CuratedTemplates/UsePage",
  component: CuratedTemplateUsePage,
  args: {
    template: { title: "Launch a product", summary: "Plan and deliver your next product launch.", type: "project" },
    spaces: [{ id: "general", name: "General" }],
    defaultSpaceId: "general",
    today: "2026-10-12",
    people: [{ id: "alex", fullName: "Alex Morgan", avatarUrl: null }],
    peopleSpaceId: "general",
    homePath: "/",
    onSpaceChange: () => {},
    onCreate: async () => {},
    onCancel: () => {},
  },
} satisfies Meta<typeof CuratedTemplateUsePage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Project: Story = {};
export const Goal: Story = { args: { template: { title: "Improve retention", type: "goal" } } };
export const Kpi: Story = { args: { template: { title: "Monthly revenue", type: "kpi" } } };
export const NoWritableSpaces: Story = { args: { spaces: [] } };
export const LoadingPeople: Story = { args: { peopleSpaceId: null } };
export const FailedRequest: Story = {
  args: {
    onCreate: async () => {
      throw new Error("Unavailable");
    },
  },
};
