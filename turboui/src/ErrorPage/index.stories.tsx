import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorPage } from ".";

const meta = {
  title: "Pages/ErrorPage",
  component: ErrorPage,
  parameters: { layout: "fullscreen" },
  args: { status: 404 },
} satisfies Meta<typeof ErrorPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NotFound: Story = {};

export const ServerError: Story = { args: { status: 500, homePath: "/company" } };

export const Diagnostics: Story = {
  args: { status: 500, diagnostics: { stack: "Error: Literal diagnostic details" } },
};
