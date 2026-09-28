import type { Meta, StoryObj } from "@storybook/react-vite";
import { PublicDocumentPage } from ".";
import { defaultFormattedTimePreferences } from "../FormattedTime";

const meta: Meta<typeof PublicDocumentPage> = {
  title: "Pages/PublicDocumentPage",
  component: PublicDocumentPage,
  parameters: { layout: "fullscreen" },
  args: { formattedTimePreferences: defaultFormattedTimePreferences },
};
export default meta;
type Story = StoryObj<typeof PublicDocumentPage>;
export const Published: Story = {
  args: {
    document: {
      __typename: "public_document",
      name: "Consultant briefing",
      content: JSON.stringify({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Our priorities for the next quarter." }] }],
      }),
      publishedAt: "2026-09-21T12:00:00Z",
      updatedAt: "2026-09-23T12:00:00Z",
    },
  },
};
export const Unavailable: Story = {};
export const Loading: Story = { args: { loading: true } };
