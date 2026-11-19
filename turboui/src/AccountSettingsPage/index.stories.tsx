import type { Meta, StoryObj } from "@storybook/react-vite";
import { AccountSettingsPage } from "./index";

const meta = {
  title: "Pages/AccountSettingsPage",
  component: AccountSettingsPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AccountSettingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs: AccountSettingsPage.Props = {
  homePath: "#",
  accountPath: "#",
  preferences: { theme: "system", language: "en", timezone: "America/New_York", timeFormat: "automatic" },
  timezones: [
    { value: "America/New_York", label: "America/New_York" },
    { value: "Europe/Berlin", label: "Europe/Berlin" },
    { value: "America/Sao_Paulo", label: "America/Sao_Paulo" },
  ],
  onSave: async (preferences) => {
    console.log("Saved preferences", preferences);
  },
};

export const Default: Story = { args: defaultArgs };
export const Mobile: Story = {
  args: defaultArgs,
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
export const Saving: Story = {
  args: { ...defaultArgs, onSave: () => new Promise((resolve) => setTimeout(resolve, 3000)) },
};
export const SaveError: Story = {
  args: {
    ...defaultArgs,
    onSave: async () => {
      throw new Error("Save failed");
    },
  },
};
