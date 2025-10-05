import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { SwitchToggle } from "./index";

/**
 * SwitchToggle is a boolean toggle switch component.
 * - Uses Radix UI Switch under the hood
 * - Controlled via value/setValue props
 * - Styled for brand consistency
 */
const meta: Meta<typeof SwitchToggle> = {
  title: "Components/SwitchToggle",
  component: SwitchToggle,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SwitchToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

const Component = (args: { value: boolean }) => {
  const [value, setValue] = React.useState(args.value);
  return <SwitchToggle value={value} setValue={setValue} label="Toggle me" />;
};

export const Default: Story = {
  render: () => <Component value={false} />,
};

export const Checked: Story = {
  render: () => <Component value={true} />,
};
