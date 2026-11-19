import type { Meta, StoryObj } from "@storybook/react-vite";
import { SpaceTaskBoardCard } from "./index";

const meta: Meta<typeof SpaceTaskBoardCard> = { title: "Components/SpaceTaskBoardCard", component: SpaceTaskBoardCard };
type Story = StoryObj<typeof SpaceTaskBoardCard>;

export default meta;

export const Empty: Story = {
  args: {
    board: {
      __typename: "task_board_summary",
      id: "campaigns",
      name: "Campaigns",
      position: 1,
      isDefault: false,
      archivedAt: null,
    },
    tasks: [],
    to: "#campaigns",
  },
};

export const WithTasks: Story = {
  args: { ...Empty.args, tasks: [{ __typename: "task", id: "task", name: "Prepare launch email", type: "space" }] },
};
