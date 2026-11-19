import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StatusCell } from "./StatusCell";
import { mockTasksTabItems } from "../../tests/mockData";
import { WorkMap } from "..";
import { StatusSelector } from "../../../StatusSelector";
import { showErrorToast } from "../../../Toasts";

jest.mock("../../../Toasts", () => ({ showErrorToast: jest.fn() }));

const initialStatus: StatusSelector.StatusOption = {
  id: "todo",
  value: "todo",
  label: "Queued",
  color: "gray",
  icon: "circleDashed",
  index: 0,
  closed: false,
};
const nextStatus: StatusSelector.StatusOption = {
  id: "review",
  value: "review",
  label: "In review",
  color: "blue",
  icon: "circleDot",
  index: 1,
  closed: false,
};
const doneStatus: StatusSelector.StatusOption = {
  id: "done",
  value: "done",
  label: "Done",
  color: "green",
  icon: "circleCheck",
  index: 2,
  closed: true,
};
const [baseTask] = mockTasksTabItems;
if (!baseTask) throw new Error("Missing task fixture");
const task: WorkMap.Item = {
  ...baseTask,
  taskStatus: initialStatus,
  taskStatuses: [initialStatus, nextStatus, doneStatus],
  canEditTask: true,
};

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

function renderCell(item: WorkMap.Item, onTaskStatusChange?: WorkMap.TaskStatusChangeFn) {
  return render(
    <table>
      <tbody>
        <tr>
          <StatusCell item={item} onTaskStatusChange={onTaskStatusChange} />
        </tr>
      </tbody>
    </table>,
  );
}

test.each([nextStatus, doneStatus])(
  "shows $value immediately and retains it while awaiting refetched data",
  async (status) => {
    let finish: () => void = () => {};
    const save = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { rerender } = renderCell(task, save);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText(status.label));
    expect(save).toHaveBeenCalledWith(task, status);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("cell")).toHaveTextContent(status.label);
    await act(async () => finish());
    expect(screen.getByRole("button")).toHaveTextContent(status.label);

    const renderUpdatedTask = (item: WorkMap.Item) => (
      <table>
        <tbody>
          <tr>
            <StatusCell item={item} onTaskStatusChange={save} />
          </tr>
        </tbody>
      </table>
    );
    rerender(renderUpdatedTask({ ...task, taskStatus: { ...initialStatus } }));
    expect(screen.getByRole("button")).toHaveTextContent(status.label);
    rerender(renderUpdatedTask({ ...task, taskStatus: status }));
    expect(screen.getByRole("button")).toHaveTextContent(status.label);
    rerender(renderUpdatedTask({ ...task, taskStatus: initialStatus }));
    expect(screen.getByRole("button")).toHaveTextContent(initialStatus.label);
  },
);

test.each(["no callback", "no permission", "project"])("keeps the badge read-only with %s", (state) => {
  renderCell(
    { ...task, canEditTask: state !== "no permission", type: state === "project" ? "project" : "task" },
    state === "no callback" ? undefined : jest.fn(),
  );
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.getByText(initialStatus.label)).toBeVisible();
});

test("reverts the optimistic status and reports a failed save", async () => {
  let fail: (error: Error) => void = () => {};
  renderCell(
    task,
    () =>
      new Promise<void>((_resolve, reject) => {
        fail = reject;
      }),
  );
  fireEvent.click(screen.getByRole("button"));
  fireEvent.click(screen.getByText(nextStatus.label));
  expect(screen.getByRole("cell")).toHaveTextContent(nextStatus.label);
  await act(async () => fail(new Error("Offline")));
  await waitFor(() => expect(showErrorToast).toHaveBeenCalled());
  expect(screen.getByRole("button")).toHaveTextContent(initialStatus.label);
});
