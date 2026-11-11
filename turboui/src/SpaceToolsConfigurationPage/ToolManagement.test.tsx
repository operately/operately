import React, { act } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import { ToolManagement, type ToolManagementProps } from "./ToolManagement";

jest.mock("@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box", () => ({ DropIndicator: () => null }));

const boards: ToolManagementProps["boards"] = [
  { __typename: "task_board_summary", id: "default", name: "Tasks", position: 0, isDefault: true, archivedAt: null },
  {
    __typename: "task_board_summary",
    id: "second",
    name: "Campaigns",
    position: 1,
    isDefault: false,
    archivedAt: null,
  },
  {
    __typename: "task_board_summary",
    id: "old",
    name: "Past work",
    position: 2,
    isDefault: false,
    archivedAt: "2026-01-01",
  },
];
const hubs: ToolManagementProps["hubs"] = [
  { __typename: "resource_hub_summary", id: "hub", name: "Documents", position: 0, isDefault: true },
  { __typename: "resource_hub_summary", id: "second-hub", name: "Brand", position: 1, isDefault: false },
];
function setup(overrides: Partial<ToolManagementProps> = {}) {
  const onAction = jest.fn(async () => true);
  render(
    <MemoryRouter>
      {(["board", "hub"] as const).map((kind) => (
        <ToolManagement key={kind} kind={kind} boards={boards} hubs={hubs} canEdit onAction={onAction} {...overrides} />
      ))}
    </MemoryRouter>,
  );
  return { onAction, user: userEvent.setup() };
}

it("keeps the entered name after a failed creation and closes after retry", async () => {
  const onAction = jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  const { user } = setup({ onAction });
  await user.click(screen.getByRole("button", { name: "New board" }));
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  Planning  " } });
  await user.click(screen.getByRole("button", { name: "Create" }));
  expect(onAction).toHaveBeenLastCalledWith({ kind: "board", type: "create", name: "Planning" });
  expect(screen.getByLabelText("Name")).toHaveValue("  Planning  ");
  await user.click(screen.getByRole("button", { name: "Create" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

it("protects defaults and requires confirmation before archiving", async () => {
  const { onAction, user } = setup();
  await user.click(screen.getByRole("button", { name: "Actions for Tasks" }));
  expect(screen.queryByRole("menuitem", { name: "Archive" })).not.toBeInTheDocument();
  expect(screen.queryByRole("menuitem", { name: "Set as default" })).not.toBeInTheDocument();
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Actions for Documents" }));
  expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Actions for Campaigns" }));
  await user.click(screen.getByRole("menuitem", { name: "Archive" }));
  expect(onAction).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Archive" }));
  expect(onAction).toHaveBeenCalledWith({ kind: "board", type: "archive", id: "second" });
});

it("keeps archived boards available for restore without drag handles", async () => {
  const { onAction, user } = setup();
  await user.click(screen.getByText("Archived boards"));
  expect(screen.getByText("Past work")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Reorder Past work" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Actions for Past work" }));
  await user.click(screen.getByRole("menuitem", { name: "Restore" }));
  expect(onAction).toHaveBeenCalledWith({ kind: "board", type: "restore", id: "old" });
});

it("shows plain names without management permissions", () => {
  setup({ canEdit: false });
  expect(screen.getByText("Campaigns")).toBeInTheDocument();
  expect(screen.getByText("Brand")).toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it.each([
  ["board", "Campaigns", ["second", "default"]],
  ["hub", "Brand", ["second-hub", "hub"]],
])("reorders only the active %s list using the handle's keyboard controls", async (kind, name, ids) => {
  const { onAction, user } = setup();
  const handle = screen.getByRole("button", { name: `Reorder ${name}` });
  handle.focus();
  await user.keyboard("{ArrowUp}");
  expect(onAction).toHaveBeenCalledWith({ kind, type: "reorder", ids });
});

it("restores the saved order after a failed reorder", async () => {
  let finish: (success: boolean) => void = () => {};
  const onAction = jest.fn(
    () =>
      new Promise<boolean>((resolve) => {
        finish = resolve;
      }),
  );
  setup({ onAction });
  const listOrder = () =>
    Array.from(document.querySelectorAll('[data-test-id="board-list"] > div'), (row) =>
      row.getAttribute("data-test-id"),
    );
  fireEvent.keyDown(screen.getByRole("button", { name: "Reorder Campaigns" }), { key: "ArrowUp" });
  expect(listOrder()).toEqual(["tool-instance-second", "tool-instance-default"]);
  expect(screen.getByRole("button", { name: "Reorder Campaigns" })).toBeDisabled();
  await act(async () => finish(false));
  expect(listOrder()).toEqual(["tool-instance-default", "tool-instance-second"]);
});
