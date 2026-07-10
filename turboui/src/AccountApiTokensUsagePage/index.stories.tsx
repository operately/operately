import type { Meta, StoryObj } from "@storybook/react-vite";
import { AccountApiTokensUsagePage } from "./index";

const meta = {
  title: "Pages/AccountApiTokensUsagePage",
  component: AccountApiTokensUsagePage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AccountApiTokensUsagePage>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs: AccountApiTokensUsagePage.Props = {
  homePath: "#",
  securityPath: "#",
  apiTokensPath: "#",
  baseUrl: "https://app.operately.com",
  externalBasePath: "/api/external/v1",
};

export const Default: Story = {
  args: defaultArgs,
};

export const Mobile: Story = {
  args: defaultArgs,
  globals: {
    viewport: {
      value: "mobile1",
      isRotated: false
    }
  },
};
