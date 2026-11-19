import React from "react";
import { showErrorToast } from "../Toasts";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SpaceToolsConfigurationPage, type ToolAction } from "./index";
import type { TaskBoardSummary, ResourceHubSummary } from "../ApiTypes";

const meta: Meta<typeof SpaceToolsConfigurationPage> = {
  title: "Pages/SpaceToolsConfigurationPage",
  component: SpaceToolsConfigurationPage,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof SpaceToolsConfigurationPage>;

function Example({ empty = false, readOnly = false, fail = false, disabled = false }) {
  const [tools, setTools] = React.useState({
    discussionsEnabled: true,
    resourceHubEnabled: !disabled,
    tasksEnabled: !disabled,
    templatesEnabled: true,
    kpisEnabled: false,
  });
  const [boards, setBoards] = React.useState<TaskBoardSummary[]>(
    empty
      ? []
      : [
          {
            __typename: "task_board_summary",
            id: "tasks",
            name: "Tasks",
            position: 0,
            isDefault: true,
            archivedAt: null,
          },
          {
            __typename: "task_board_summary",
            id: "campaigns",
            name: "Campaigns",
            position: 1,
            isDefault: false,
            archivedAt: null,
          },
          {
            __typename: "task_board_summary",
            id: "archive",
            name: "Summer launch",
            position: 2,
            isDefault: false,
            archivedAt: "2026-08-01",
          },
        ],
  );
  const [hubs, setHubs] = React.useState<ResourceHubSummary[]>(
    empty
      ? []
      : [
          { __typename: "resource_hub_summary", id: "docs", name: "Docs & Files", position: 0, isDefault: true },
          { __typename: "resource_hub_summary", id: "brand", name: "Brand assets", position: 1, isDefault: false },
        ],
  );
  const onAction = async (action: ToolAction) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (fail) {
      showErrorToast("Could not update space tools", "Please try again.");
      return false;
    }
    if (action.kind === "board") {
      setBoards((items) => {
        switch (action.type) {
          case "create":
            return [
              ...items,
              {
                __typename: "task_board_summary",
                id: String(Date.now()),
                name: action.name,
                position: items.length,
                isDefault: items.length === 0,
                archivedAt: null,
              },
            ];
          case "rename":
            return items.map((i) => (i.id === action.id ? { ...i, name: action.name } : i));
          case "reorder":
            return [
              ...items.filter((i) => !i.archivedAt).sort((a, b) => action.ids.indexOf(a.id) - action.ids.indexOf(b.id)),
              ...items.filter((i) => i.archivedAt),
            ];
          case "setDefault":
            return items.map((i) => ({ ...i, isDefault: i.id === action.id }));
          case "archive":
            return items.map((i) => (i.id === action.id ? { ...i, archivedAt: new Date().toISOString() } : i));
          case "restore":
            return [
              ...items.filter((i) => i.id !== action.id),
              ...items.filter((i) => i.id === action.id).map((i) => ({ ...i, archivedAt: null })),
            ];
        }
      });
    } else {
      setHubs((items) => {
        switch (action.type) {
          case "create":
            return [
              ...items,
              {
                __typename: "resource_hub_summary",
                id: String(Date.now()),
                name: action.name,
                position: items.length,
                isDefault: items.length === 0,
              },
            ];
          case "rename":
            return items.map((i) => (i.id === action.id ? { ...i, name: action.name } : i));
          case "reorder":
            return [...items].sort((a, b) => action.ids.indexOf(a.id) - action.ids.indexOf(b.id));
          case "delete":
            return items.filter((i) => i.id !== action.id);
        }
      });
    }
    return true;
  };
  return (
    <SpaceToolsConfigurationPage
      title={["Configure tools", "Marketing"]}
      navigation={[{ label: "Marketing", to: "#" }]}
      tools={tools}
      onToolsChange={setTools}
      onSave={async () => {}}
      onCancel={() => {}}
      management={{
        boards,
        hubs,
        canEdit: !readOnly,
        onAction,
      }}
    />
  );
}

export const Default: Story = { render: () => <Example /> };
export const DisabledCategories: Story = { render: () => <Example disabled /> };
export const Empty: Story = { render: () => <Example empty /> };
export const ReadOnly: Story = { render: () => <Example readOnly /> };
export const FailedSave: Story = { render: () => <Example fail /> };
