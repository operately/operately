import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { FolderSelectField } from ".";
import { ResourceHubTypeIcon } from "../ResourceHub/NodeIcon";

const populatedNodes: FolderSelectField.Node[] = [
  {
    id: "assets",
    name: "Assets",
    selectable: true,
    icon: <ResourceHubTypeIcon type="folder" size={16} />,
    onSelect: () => undefined,
  },
  {
    id: "guide",
    name: "Launch guide",
    selectable: false,
    icon: <ResourceHubTypeIcon type="document" size={16} />,
    onSelect: () => undefined,
  },
  {
    id: "spec",
    name: "Design spec",
    selectable: false,
    icon: <ResourceHubTypeIcon type="link" size={16} />,
    onSelect: () => undefined,
  },
];

const meta = {
  title: "Components/Fields/FolderSelectField",
  component: FolderSelectField,
  parameters: { layout: "centered" },
  args: {
    label: "Select destination",
    field: "location",
    current: { id: "root", name: "Documents & Files" },
    nodes: populatedNodes,
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FolderSelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveField() {
  const [current, setCurrent] = React.useState({ id: "root", name: "Documents & Files" });

  return (
    <FolderSelectField
      label="Select destination"
      field="location"
      current={current}
      onGoBack={current.id === "root" ? undefined : () => setCurrent({ id: "root", name: "Documents & Files" })}
      nodes={
        current.id === "root"
          ? populatedNodes.map((node) => ({
              ...node,
              onSelect: () => {
                if (node.selectable) setCurrent({ id: node.id, name: node.name });
              },
            }))
          : []
      }
    />
  );
}

export const Populated: Story = {
  render: () => <InteractiveField />,
};

export const Empty: Story = {
  args: {
    current: { id: "assets", name: "Assets" },
    onGoBack: () => undefined,
    nodes: [],
  },
};

export const Loading: Story = {
  args: {
    nodes: [
      {
        id: "assets",
        name: "Assets",
        selectable: true,
        loading: true,
        icon: <ResourceHubTypeIcon type="folder" size={16} />,
        onSelect: () => undefined,
      },
      populatedNodes[1]!,
    ],
  },
};

export const WithBackButton: Story = {
  args: {
    current: { id: "assets", name: "Assets" },
    onGoBack: () => undefined,
    nodes: [populatedNodes[1]!],
  },
};
