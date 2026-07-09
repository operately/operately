import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { Checkbox } from "./index";

/**
 * Checkbox is a boolean selection component that works great in both light and dark modes.
 * - Uses design system colors that adapt to dark/light themes
 * - Proper accessibility with aria attributes
 * - Multiple sizes available
 * - Can be used with or without labels
 */
const meta: Meta<typeof Checkbox> = {
  title: "Components/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

const Component = (args: { checked: boolean; disabled?: boolean; size?: "sm" | "md" | "lg"; label?: string }) => {
  const [checked, setChecked] = React.useState(args.checked);
  return (
    <Checkbox checked={checked} onChange={setChecked} disabled={args.disabled} size={args.size} label={args.label} />
  );
};

export const Default: Story = {
  render: () => <Component checked={false} label="Check me" />,
};

export const Checked: Story = {
  render: () => <Component checked={true} label="I am checked" />,
};

export const WithoutLabel: Story = {
  render: () => <Component checked={false} />,
};

export const CheckedWithoutLabel: Story = {
  render: () => <Component checked={true} />,
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <Component checked={false} disabled={true} label="Disabled unchecked" />
      <Component checked={true} disabled={true} label="Disabled checked" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Component checked={true} size="sm" label="Small checkbox" />
      <Component checked={true} size="md" label="Medium checkbox" />
      <Component checked={true} size="lg" label="Large checkbox" />
    </div>
  ),
};

export const MultipleCheckboxes: Story = {
  render: () => {
    const CheckboxGroup = () => {
      const [values, setValues] = React.useState({
        option1: false,
        option2: true,
        option3: false,
        option4: true,
      });

      return (
        <div className="space-y-3">
          <h3 className="text-content-base font-semibold mb-3">Select your preferences:</h3>
          <Checkbox
            checked={values.option1}
            onChange={(checked) => setValues({ ...values, option1: checked })}
            label="Email notifications"
          />
          <Checkbox
            checked={values.option2}
            onChange={(checked) => setValues({ ...values, option2: checked })}
            label="Push notifications"
          />
          <Checkbox
            checked={values.option3}
            onChange={(checked) => setValues({ ...values, option3: checked })}
            label="Weekly digest"
          />
          <Checkbox
            checked={values.option4}
            onChange={(checked) => setValues({ ...values, option4: checked })}
            label="Project updates"
          />
        </div>
      );
    };

    return <CheckboxGroup />;
  },
};

export const DarkModeTest: Story = {
  render: () => (
    <div className="dark bg-surface-bg p-6 rounded-lg">
      <div className="space-y-4">
        <h3 className="text-content-base font-semibold mb-3">Checkboxes in Dark Mode:</h3>
        <Component checked={false} label="Unchecked in dark mode" />
        <Component checked={true} label="Checked in dark mode" />
        <Component checked={false} disabled={true} label="Disabled unchecked in dark mode" />
        <Component checked={true} disabled={true} label="Disabled checked in dark mode" />
      </div>
    </div>
  ),
};
