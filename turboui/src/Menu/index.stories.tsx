import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { Menu, MenuActionItem } from "./index";

const meta = {
  title: "Components/Menu",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function ExampleMenu({ readonly }: { readonly?: boolean }) {
  return (
    <Menu testId="menu" readonly={readonly}>
      <MenuActionItem onClick={() => console.log("edit")}>Edit</MenuActionItem>
      <MenuActionItem onClick={() => console.log("delete")} danger>
        Delete
      </MenuActionItem>
    </Menu>
  );
}

export const Default: Story = {
  render: () => <ExampleMenu />,
};

export const ReadOnly: Story = {
  render: () => <ExampleMenu readonly />,
};
