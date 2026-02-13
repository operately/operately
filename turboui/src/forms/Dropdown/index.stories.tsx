import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { Dropdown } from ".";

const meta = {
  title: "Components/Forms/Dropdown",
  component: Dropdown,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockItems = [
  { id: "item-1", name: "Product" },
  { id: "item-2", name: "Engineering" },
  { id: "item-3", name: "Design" },
  { id: "item-4", name: "Marketing" },
  { id: "item-5", name: "Sales" },
];

export const Default: Story = {
  args: {} as any,
  render: () => {
    const [selected, setSelected] = React.useState("item-1");

    return (
      <div style={{ width: "300px" }}>
        <Dropdown
          items={mockItems}
          value={selected}
          onSelect={(item) => setSelected(item.id)}
          placeholder="Select an item..."
        />
      </div>
    );
  },
};

export const WithoutSelection: Story = {
  args: {} as any,
  render: () => {
    const [selected, setSelected] = React.useState("");

    return (
      <div style={{ width: "300px" }}>
        <Dropdown
          items={mockItems}
          value={selected}
          onSelect={(item) => setSelected(item.id)}
          placeholder="Choose an option..."
        />
      </div>
    );
  },
};

export const WithManyItems: Story = {
  args: {} as any,
  render: () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i}`,
      name: `Option ${i + 1}`,
    }));

    const [selected, setSelected] = React.useState("item-0");

    return (
      <div style={{ width: "300px" }}>
        <Dropdown
          items={items}
          value={selected}
          onSelect={(item) => setSelected(item.id)}
          placeholder="Select an option..."
        />
      </div>
    );
  },
};
