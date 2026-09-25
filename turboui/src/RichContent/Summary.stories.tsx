import type { Meta, StoryObj } from "@storybook/react-vite";
import { Summary } from "./Summary";
import tableFixtures from "../../../app/test/fixtures/rich_text/tables.json";

const meta: Meta<typeof Summary> = {
  title: "Components/RichContent/Summary",
  component: Summary,
  args: {
    content: tableFixtures[0]?.document,
    characterCount: 500,
    mentionedPersonLookup: async () => null,
  },
};

export default meta;
type Story = StoryObj<typeof Summary>;

export const TableAsText: Story = {};
export const TruncatedTable: Story = { args: { characterCount: 40 } };
export const HeaderlessTable: Story = { args: { content: tableFixtures[1]?.document } };
