/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@/__tests__/renderHook";
import { showErrorToast } from "turboui";
import { useMilestoneCompletion } from "./useMilestoneCompletion";

jest.mock("axios");
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));

let client: QueryClient;
const closedStatus = {
  id: "done",
  label: "Done",
  value: "done",
  color: "green" as const,
  icon: "circleCheck" as const,
  closed: true,
  index: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  jest.mocked(axios.post).mockResolvedValue({ data: { comment: {} } });
});

afterEach(() => client.clear());

function mount(tasks: object[] = [], canEdit = true) {
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: String(url).includes("list_milestone_tasks")
      ? { tasks }
      : {
          milestone: {
            id: "m1",
            title: "Launch",
            status: "pending",
            permissions: { canEdit },
            availableStatuses: [closedStatus],
          },
        },
  }));
  return renderHook(() => useMilestoneCompletion(), {
    initialProps: undefined,
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}

it("completes a milestone without open tasks and refreshes task details and milestone searches", async () => {
  const hook = mount([{ id: "t1", status: closedStatus }]);
  const keys = [Api.tasks.getQueryKey({ id: "t1" }), Api.projects.listMilestonesQueryKey({ projectId: "p1" })];
  keys.forEach((key) => client.setQueryData(key, {}));

  await act(async () => {
    await hook.result.current.requestCompletion("m1");
  });

  expect(axios.post).toHaveBeenCalledWith(
    expect.any(String),
    {
      milestone_id: "m1",
      content: null,
      action: "complete",
      open_tasks_resolution: null,
    },
    expect.anything(),
  );
  expect(hook.result.current.modalProps).toBeNull();
  keys.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
});

it("asks how to resolve open tasks before completing", async () => {
  const hook = mount([
    { id: "t1", status: { closed: false } },
    { id: "t2", status: closedStatus },
  ]);
  await act(async () => {
    await hook.result.current.requestCompletion("m1");
  });

  expect(axios.post).not.toHaveBeenCalled();
  expect(hook.result.current.modalProps).toMatchObject({ milestoneName: "Launch", openTaskCount: 1 });

  await act(async () => {
    await hook.result.current.modalProps?.onComplete({ action: "move_to_no_milestone" });
  });
  expect(axios.post).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      open_tasks_resolution: { action: "move_to_no_milestone", status_id: null },
    }),
    expect.anything(),
  );
});

it("keeps the resolution dialog available when completion fails", async () => {
  const hook = mount([{ id: "t1", status: { closed: false } }]);
  await act(async () => {
    await hook.result.current.requestCompletion("m1");
  });
  jest.mocked(axios.post).mockRejectedValue(new Error("failed"));

  let completed: boolean | undefined;
  await act(async () => {
    completed = await hook.result.current.modalProps?.onComplete({ action: "set_status", status: closedStatus });
  });
  expect(completed).toBe(false);
  expect(hook.result.current.modalProps).not.toBeNull();
  expect(showErrorToast).toHaveBeenCalled();
});

it("sends the chosen closed status to the existing completion endpoint", async () => {
  const hook = mount([{ id: "t1", status: { closed: false } }]);
  await act(async () => {
    await hook.result.current.requestCompletion("m1");
  });
  await act(async () => {
    await hook.result.current.modalProps?.onComplete({ action: "set_status", status: closedStatus });
  });
  expect(axios.post).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      open_tasks_resolution: { action: "set_status", status_id: "done" },
    }),
    expect.anything(),
  );
});

it("cancels without changing the milestone or tasks", async () => {
  const hook = mount([{ id: "t1", status: { closed: false } }]);
  await act(async () => {
    await hook.result.current.requestCompletion("m1");
  });
  act(() => {
    hook.result.current.modalProps?.onClose();
  });
  expect(hook.result.current.modalProps).toBeNull();
  expect(axios.post).not.toHaveBeenCalled();
});

it("does not complete when current milestone permissions deny editing", async () => {
  const hook = mount([], false);
  await act(async () => {
    await hook.result.current.requestCompletion("m1");
  });
  expect(axios.post).not.toHaveBeenCalled();
  expect(hook.result.current.modalProps).toBeNull();
  expect(showErrorToast).toHaveBeenCalled();
});

it("does not complete when loading the task list fails", async () => {
  const hook = mount();
  jest.mocked(axios.get).mockRejectedValue(new Error("failed"));
  await act(async () => {
    await hook.result.current.requestCompletion("m1");
  });
  expect(axios.post).not.toHaveBeenCalled();
  expect(showErrorToast).toHaveBeenCalled();
});
