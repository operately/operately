import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { RelativeDayField } from ".";

const meta = {
  title: "Components/Fields/RelativeDayField",
  component: RelativeDayField,
  parameters: { layout: "centered" },
} satisfies Meta<typeof RelativeDayField>;

export default meta;
type Story = Omit<StoryObj<typeof meta>, "args"> & {
  args?: StoryObj<typeof meta>["args"];
};

function EditableField(props: Partial<RelativeDayField.Props>) {
  const [value, setValue] = React.useState<number | null>(props.value ?? null);
  return <RelativeDayField {...props} value={value} onChange={setValue} />;
}

export const Empty: Story = { render: () => <EditableField value={null} /> };
export const ProjectStartDate: Story = { render: () => <EditableField value={0} /> };
export const Scheduled: Story = { render: () => <EditableField value={14} /> };
export const Duration: Story = {
  render: () => <EditableField value={30} placeholder="Set project duration" variant="form-field" />,
};
export const ReadOnly: Story = { args: { value: 7, readonly: true } };
