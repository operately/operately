import React from "react";
import { act, configure, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MoveModal } from "./MoveModal";
import type { TaskBoardSummary } from "../ApiTypes";

jest.mock("../SpaceField", () => ({
  SpaceField: ({ setSpace }) => (
    <>
      <button type="button" onClick={() => setSpace({ id: "marketing", name: "Marketing", link: "#" })}>
        Marketing
      </button>
      <button type="button" onClick={() => setSpace({ id: "sales", name: "Sales", link: "#" })}>
        Sales
      </button>
    </>
  ),
}));
jest.mock("../ProjectField", () => ({
  ProjectField: ({ setProject }) => (
    <button type="button" onClick={() => setProject({ id: "project", name: "Website" })}>
      Website
    </button>
  ),
}));

const boards: TaskBoardSummary[] = [
  { __typename: "task_board_summary", id: "current", name: "Tasks", position: 0, isDefault: true, archivedAt: null },
  { __typename: "task_board_summary", id: "support", name: "Support", position: 1, isDefault: false, archivedAt: null },
  {
    __typename: "task_board_summary",
    id: "archived",
    name: "Archived",
    position: 2,
    isDefault: false,
    archivedAt: "2026-11-12",
  },
];

configure({ testIdAttribute: "data-test-id" });

beforeEach(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

function setup(overrides: Partial<React.ComponentProps<typeof MoveModal>> = {}) {
  const props = {
    isMoveModalOpen: true,
    closeMoveModal: jest.fn(),
    onMoveTask: jest.fn().mockResolvedValue(true),
    projectSearch: jest.fn(),
    spaceSearch: jest.fn(),
    loadMoveBoards: jest.fn().mockResolvedValue(boards),
    currentBoardId: "current",
    ...overrides,
  };
  render(<MoveModal {...props} />);
  return props;
}

async function selectSpace(user: ReturnType<typeof userEvent.setup>, name = "Marketing") {
  await user.click(screen.getByTestId("move-task-destination-type"));
  await user.click(screen.getByTestId("move-task-destination-space"));
  await user.click(screen.getByRole("button", { name }));
  await screen.findByTestId("move-task-board");
}

it("moves within the current space, excluding the current and archived boards, and requests a status only when required", async () => {
  const user = userEvent.setup();
  const onMoveTask = jest
    .fn()
    .mockResolvedValueOnce({ status: "status_mapping_required", statuses: [{ id: "review", label: "Review" }] })
    .mockResolvedValueOnce(true);
  const props = setup({ onMoveTask });
  await selectSpace(user);
  expect(screen.getByTestId("confirm-move-task")).toBeDisabled();
  await user.click(screen.getByTestId("move-task-board"));
  expect(screen.queryByRole("button", { name: "Tasks" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Archived" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Support" }));
  await user.click(screen.getByTestId("confirm-move-task"));
  expect(props.closeMoveModal).not.toHaveBeenCalled();
  await user.click(await screen.findByTestId("move-task-status"));
  await user.click(screen.getByRole("button", { name: "Review" }));
  await user.click(screen.getByTestId("confirm-move-task"));
  expect(onMoveTask).toHaveBeenLastCalledWith({
    destinationType: "space",
    destinationId: "marketing",
    destinationBoardId: "support",
    destinationStatusId: "review",
  });
  expect(props.closeMoveModal).toHaveBeenCalledTimes(1);
});

it("preselects the destination default and clears board selectors for a project move", async () => {
  const user = userEvent.setup();
  const props = setup({ currentBoardId: undefined });
  await selectSpace(user);
  expect(screen.getByTestId("move-task-board")).toHaveTextContent("Tasks");
  await user.click(screen.getByTestId("move-task-destination-type"));
  await user.click(screen.getByTestId("move-task-destination-project"));
  await user.click(screen.getByRole("button", { name: "Website" }));
  await user.click(screen.getByTestId("confirm-move-task"));
  expect(props.onMoveTask).toHaveBeenCalledWith({ destinationType: "project", destinationId: "project" });
});

it("ignores a late board response from the previously selected space", async () => {
  const user = userEvent.setup();
  let finish = (_boards: TaskBoardSummary[]) => {};
  const loadMoveBoards = jest
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce([]);
  setup({ loadMoveBoards });
  await user.click(screen.getByTestId("move-task-destination-type"));
  await user.click(screen.getByTestId("move-task-destination-space"));
  await user.click(screen.getByRole("button", { name: "Marketing" }));
  await user.click(screen.getByRole("button", { name: "Sales" }));
  await waitFor(() => expect(loadMoveBoards).toHaveBeenCalledWith("sales"));
  await act(async () => finish(boards));
  expect(screen.queryByTestId("move-task-board")).not.toBeInTheDocument();
  expect(screen.getByTestId("confirm-move-task")).toBeDisabled();
});

it("keeps the dialog open and reloads destinations if a board was archived after selection", async () => {
  const user = userEvent.setup();
  const loadMoveBoards = jest.fn().mockResolvedValueOnce(boards).mockResolvedValueOnce([]);
  const props = setup({
    currentBoardId: undefined,
    loadMoveBoards,
    onMoveTask: jest.fn().mockResolvedValue({ status: "board_unavailable" }),
  });
  await selectSpace(user);
  await user.click(screen.getByTestId("confirm-move-task"));
  await waitFor(() => expect(loadMoveBoards).toHaveBeenCalledTimes(2));
  expect(props.closeMoveModal).not.toHaveBeenCalled();
  expect(screen.getByTestId("confirm-move-task")).toBeDisabled();
});

it("preserves the board and status selection when reselecting the same space", async () => {
  const user = userEvent.setup();
  const onMoveTask = jest
    .fn()
    .mockResolvedValueOnce({ status: "status_mapping_required", statuses: [{ id: "review", label: "Review" }] })
    .mockResolvedValueOnce(true);
  setup({ currentBoardId: undefined, onMoveTask });
  await selectSpace(user);

  await user.click(screen.getByRole("button", { name: "Marketing" }));
  expect(screen.getByTestId("move-task-board")).toHaveTextContent("Tasks");
  expect(screen.getByTestId("confirm-move-task")).toBeEnabled();

  await user.click(screen.getByTestId("move-task-board"));
  await user.click(screen.getByTestId("move-task-board-support"));
  await user.click(screen.getByTestId("confirm-move-task"));
  await user.click(await screen.findByTestId("move-task-status"));
  await user.click(screen.getByTestId("move-task-status-review"));

  await user.click(screen.getByRole("button", { name: "Marketing" }));
  expect(screen.getByTestId("move-task-board")).toHaveTextContent("Support");
  expect(screen.getByTestId("move-task-status")).toHaveTextContent("Review");
  expect(screen.getByTestId("confirm-move-task")).toBeEnabled();
  await user.click(screen.getByTestId("confirm-move-task"));
  expect(onMoveTask).toHaveBeenLastCalledWith({
    destinationType: "space",
    destinationId: "marketing",
    destinationBoardId: "support",
    destinationStatusId: "review",
  });
});
