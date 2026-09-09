/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { act, renderHook } from "@/__tests__/renderHook";
import { useTaskStatuses } from "./useTaskStatuses";
import { showErrorToast } from "turboui";

const mockSave = jest.fn();

jest.mock("./projectLifecycle", () => ({ useUpdateProjectTaskStatuses: () => ({ mutateAsync: mockSave }) }));
jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));
jest.mock("@/models/tasks", () => ({
  parseTaskStatusesForTurboUi: () => [],
  serializeTaskStatuses: (statuses: unknown) => statuses,
}));

beforeEach(() => {
  jest.clearAllMocks();
});

it.each(["success", "false", "throw", "refresh failure"])(
  "preserves custom status save behavior: %s",
  async (outcome) => {
    const refresh = jest.fn();
    if (outcome === "throw") mockSave.mockRejectedValue(new Error("failed"));
    else mockSave.mockResolvedValue({ success: outcome !== "false" });
    if (outcome === "refresh failure") refresh.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useTaskStatuses("p1", [], refresh), { initialProps: {} });
    await act(async () =>
      result.current.handleSaveStatuses({ nextStatuses: [], deletedStatusReplacements: { old: "new" } }),
    );
    expect(mockSave).toHaveBeenCalledWith({
      projectId: "p1",
      taskStatuses: [],
      deletedStatusReplacements: [{ deletedStatusId: "old", replacementStatusId: "new" }],
    });
    expect(showErrorToast).toHaveBeenCalledTimes(outcome === "false" || outcome === "throw" ? 1 : 0);
    expect(refresh).toHaveBeenCalledTimes(outcome === "false" || outcome === "throw" ? 0 : 1);
  },
);

it("does not refresh the next project after a late save", async () => {
  let finish: (value: unknown) => void = () => {};
  mockSave.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const refresh = jest.fn();
  const { result, rerender } = renderHook(({ id }) => useTaskStatuses(id, [], refresh), { initialProps: { id: "p1" } });
  let saving: Promise<void> = Promise.resolve();
  act(() => {
    saving = result.current.handleSaveStatuses({ nextStatuses: [], deletedStatusReplacements: {} });
  });
  rerender({ id: "p2" });
  await act(async () => {
    finish({ success: true });
    await saving;
  });
  expect(refresh).not.toHaveBeenCalled();
});
