import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoveModal } from "./MoveModal";
import { PrimaryButton } from "../Button";

const meta = {
  title: "Components/TaskPage/MoveModal",
  component: MoveModal,
  args: {
    projectSearch: async () => [{ id: "project", name: "Website", link: "#" }],
    spaceSearch: async () => [{ id: "marketing", name: "Marketing", link: "#" }],
    currentBoardId: "tasks",
    loadMoveBoards: async () => [
      { __typename: "task_board_summary", id: "tasks", name: "Tasks", isDefault: true, archivedAt: null, position: 0 },
      {
        __typename: "task_board_summary",
        id: "campaigns",
        name: "Campaigns",
        isDefault: false,
        archivedAt: null,
        position: 1,
      },
    ],
    onMoveTask: async (input) =>
      input.destinationType === "space" && !input.destinationStatusId
        ? {
            status: "status_mapping_required",
            statuses: [
              { id: "review", label: "Review" },
              { id: "ready", label: "Ready" },
            ],
          }
        : true,
  },
  render: (args) => {
    const [isOpen, setIsOpen] = React.useState(true);
    return (
      <>
        <PrimaryButton onClick={() => setIsOpen(true)}>Move task</PrimaryButton>
        <MoveModal {...args} isMoveModalOpen={isOpen} closeMoveModal={() => setIsOpen(false)} />
      </>
    );
  },
} satisfies Meta<typeof MoveModal>;

type Story = StoryObj<typeof meta>;

export default meta;

export const StatusMapping: Story = {};

export const Loading: Story = { args: { loadMoveBoards: () => new Promise(() => {}) } };

export const NoDestinations: Story = { args: { loadMoveBoards: async () => [] } };

export const FailedLoad: Story = {
  args: {
    loadMoveBoards: async () => {
      throw new Error("Unavailable");
    },
  },
};
