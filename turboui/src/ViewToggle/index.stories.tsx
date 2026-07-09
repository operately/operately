import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";

import { IconTable, IconTimeline } from "../icons";
import { ViewToggle } from ".";

const meta: Meta<typeof ViewToggle> = {
  title: "Components/ViewToggle",
  component: ViewToggle,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof ViewToggle>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<"table" | "timeline">("timeline");

    return (
      <ViewToggle
        value={value}
        ariaLabel="View"
        options={[
          { value: "table", label: "Table", icon: <IconTable size={14} />, onSelect: (next) => setValue(next) },
          {
            value: "timeline",
            label: "Timeline",
            icon: <IconTimeline size={14} />,
            onSelect: (next) => setValue(next),
          },
        ]}
      />
    );
  },
};
