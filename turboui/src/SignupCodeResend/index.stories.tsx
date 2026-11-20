import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { SignupCodeResend } from ".";

const meta = {
  title: "Components/SignupCodeResend",
  component: SignupCodeResend,
  parameters: { layout: "centered" },
  args: { email: "alex@example.com", state: "idle", onResend: fn() },
} satisfies Meta<typeof SignupCodeResend>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button");
    button.focus();
    await expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onResend).toHaveBeenCalledTimes(1);
  },
};

export const Sending: Story = {
  args: { state: "sending" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeDisabled();
    await userEvent.click(canvas.getByRole("button"));
    await expect(args.onResend).not.toHaveBeenCalled();
    await expect(canvas.getByRole("status")).not.toBeEmptyDOMElement();
  },
};

export const Success: Story = { args: { state: "success" } };
export const Error: Story = { args: { state: "error" } };

export const Cooldown: Story = {
  args: { retrySeconds: 60 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeDisabled();
    await userEvent.click(canvas.getByRole("button"));
    await expect(args.onResend).not.toHaveBeenCalled();
  },
};
