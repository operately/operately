import type { Meta, StoryObj } from "@storybook/react";
import { CuratedTemplateUsePage } from ".";

const meta = {
  title: "Pages/CuratedTemplates/UsePage",
  component: CuratedTemplateUsePage,
  args: {
    template: { title: "Launch a product", summary: "Plan and deliver your next product launch.", type: "project" },
    spaces: [{ id: "general", name: "General" }],
    defaultSpaceId: "general",
    today: "2026-10-12",
    people: [{ id: "alex", fullName: "Alex Morgan", avatarUrl: null }],
    peopleSpaceId: "general",
    peopleError: false,
    peopleLoading: false,
    onRetryPeople: () => console.log("onRetryPeople"),
    homePath: "/",
    onSpaceChange: (id) => console.log("onSpaceChange", id),
    onCreate: async (settings) => console.log("onCreate", settings),
    onCancel: () => console.log("onCancel"),
  },
} satisfies Meta<typeof CuratedTemplateUsePage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Project: Story = {};
export const Goal: Story = {
  args: {
    template: {
      title: "Improve retention",
      summary: "Set targets and track your progress toward keeping more customers.",
      type: "goal",
    },
  },
};
export const Kpi: Story = {
  args: {
    template: {
      title: "Monthly revenue",
      summary: "Track revenue over time to understand how your business is growing.",
      type: "kpi",
    },
  },
};
export const Mobile: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
  parameters: { viewport: { options: { mobile1: { name: "Mobile", styles: { width: "375px", height: "812px" } } } } },
};
export const NoWritableSpaces: Story = { args: { spaces: [] } };
export const LoadingPeople: Story = { args: { peopleSpaceId: null, peopleLoading: true } };
export const FailedPeopleRequest: Story = { args: { peopleSpaceId: null, peopleError: true } };
export const FailedRequest: Story = {
  args: {
    onCreate: async (settings) => {
      console.log("onCreate", settings);
      throw new Error("Unavailable");
    },
  },
};
