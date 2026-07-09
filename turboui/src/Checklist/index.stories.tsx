import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checklist } from "./index";
import { Page } from "../Page";

const meta: Meta<typeof Checklist> = {
  title: "Components/Checklist",
  component: Checklist,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockItems: Checklist.ChecklistItem[] = [
  {
    id: "1",
    name: "Complete user research interviews",
    completed: true,
    index: 0,
    mode: "view",
  },
  {
    id: "2",
    name: "Design wireframes for new feature",
    completed: false,
    index: 1,
    mode: "view",
  },
  {
    id: "3",
    name: "Set up development environment with proper testing infrastructure and CI/CD pipeline",
    completed: false,
    index: 2,
    mode: "view",
  },
];

function createMockHandlers() {
  return {
    addItem: async (inputs: { name: string }) => {
      console.log("Adding item:", inputs);
      return { success: true, id: Date.now().toString() };
    },
    deleteItem: async (id: string) => {
      console.log("Deleting item:", id);
      return true;
    },
    updateItem: async (inputs: { itemId: string; name: string }) => {
      console.log("Updating item:", inputs);
      return true;
    },
    toggleItem: async (id: string, completed: boolean) => {
      console.log("Toggling item:", id, completed);
      return true;
    },
    updateItemIndex: async (id: string, index: number) => {
      console.log("Updating index:", id, index);
      return true;
    },
  };
}

export const Default: Story = {
  render: () => {
    const [items, setItems] = React.useState(mockItems);

    const handlers = {
      ...createMockHandlers(),
      addItem: async (inputs: { name: string }) => {
        const newItem: Checklist.ChecklistItem = {
          id: Date.now().toString(),
          name: inputs.name,
          completed: false,
          index: items.length,
          mode: "view",
        };
        setItems((prev) => [...prev, newItem]);
        return { success: true, id: newItem.id };
      },
      deleteItem: async (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
        return true;
      },
      updateItem: async (inputs: { itemId: string; name: string }) => {
        setItems((prev) => prev.map((item) => (item.id === inputs.itemId ? { ...item, name: inputs.name } : item)));
        return true;
      },
      toggleItem: async (id: string, completed: boolean) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, completed } : item)));
        return true;
      },
    };

    return (
      <Page title="Checklist - Default" size="medium">
        <div className="p-8">
          <div className="max-w-2xl">
            <Checklist items={items} canEdit={true} {...handlers} />
          </div>
        </div>
      </Page>
    );
  },
};

export const Empty: Story = {
  render: () => {
    const [items, setItems] = React.useState<Checklist.ChecklistItem[]>([]);

    const handlers = {
      ...createMockHandlers(),
      addItem: async (inputs: { name: string }) => {
        const newItem: Checklist.ChecklistItem = {
          id: Date.now().toString(),
          name: inputs.name,
          completed: false,
          index: 0,
          mode: "view",
        };
        setItems([newItem]);
        return { success: true, id: newItem.id };
      },
    };

    return (
      <Page title="Checklist - Empty" size="medium">
        <div className="p-8">
          <div className="max-w-2xl">
            <Checklist items={items} canEdit={true} {...handlers} />
          </div>
        </div>
      </Page>
    );
  },
};

export const ReadOnly: Story = {
  render: () => {
    return (
      <Page title="Checklist - Read Only" size="medium">
        <div className="p-8">
          <div className="max-w-2xl">
            <Checklist items={mockItems} canEdit={false} {...createMockHandlers()} />
          </div>
        </div>
      </Page>
    );
  },
};

export const MixedCompletion: Story = {
  render: () => {
    const mixedItems = mockItems.map((item, index) => ({
      ...item,
      completed: index % 2 === 0, // Alternate completed/incomplete
    }));

    return (
      <Page title="Checklist - Mixed Completion" size="medium">
        <div className="p-8">
          <div className="max-w-2xl">
            <Checklist items={mixedItems} canEdit={true} {...createMockHandlers()} />
          </div>
        </div>
      </Page>
    );
  },
};

export const AllCompleted: Story = {
  render: () => {
    const completedItems = mockItems.map((item) => ({ ...item, completed: true }));

    return (
      <Page title="Checklist - All Completed" size="medium">
        <div className="p-8">
          <div className="max-w-2xl">
            <Checklist items={completedItems} canEdit={true} {...createMockHandlers()} />
          </div>
        </div>
      </Page>
    );
  },
};
