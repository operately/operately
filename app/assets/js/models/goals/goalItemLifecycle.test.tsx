/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import { act, renderHook } from "@/__tests__/renderHook";
import * as Lifecycle from "./goalItemLifecycle";

jest.mock("axios");
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));

const cases = [
  [Lifecycle.useCreateGoalTarget, "create_target", { name: "Target", startValue: 0, targetValue: 10, unit: "items" }],
  [Lifecycle.useDeleteGoalTarget, "delete_target", { targetId: "target1" }],
  [
    Lifecycle.useUpdateGoalTarget,
    "update_target",
    { targetId: "target1", name: "Target", startValue: 0, targetValue: 10, unit: "items" },
  ],
  [Lifecycle.useUpdateGoalTargetValue, "update_target_value", { targetId: "target1", value: 5 }],
  [Lifecycle.useUpdateGoalTargetIndex, "update_target_index", { targetId: "target1", index: 1 }],
  [Lifecycle.useCreateGoalCheck, "create_check", { name: "Check" }],
  [Lifecycle.useDeleteGoalCheck, "delete_check", { checkId: "check1" }],
  [Lifecycle.useUpdateGoalCheck, "update_check", { checkId: "check1", name: "New" }],
  [Lifecycle.useToggleGoalCheck, "toggle_check", { checkId: "check1" }],
  [Lifecycle.useUpdateGoalCheckIndex, "update_check_index", { checkId: "check1", index: 1 }],
] as const;

it.each(cases)("%p uses %s and invalidates only accepted writes", async (useHook, endpoint, input) => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  const client = new QueryClient();
  const key = Api.goals.getQueryKey({ id: "goal1", includeChecklist: true });
  client.setQueryData(key, {});
  const { result, unmount } = renderHook(() => useHook(), {
    initialProps: undefined,
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
  const save = result.current.mutateAsync as (input: any) => Promise<unknown>;
  try {
    jest.mocked(axios.post).mockRejectedValueOnce(new Error("Offline"));
    await act(async () => {
      await expect(save({ goalId: "goal1", ...input })).rejects.toThrow("Offline");
    });
    expect(client.getQueryState(key)?.isInvalidated).toBe(false);
    jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: false } });
    await act(async () => {
      await expect(save({ goalId: "goal1", ...input })).rejects.toThrow();
    });
    expect(client.getQueryState(key)?.isInvalidated).toBe(false);
    jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } });
    await act(async () => {
      await save({ goalId: "goal1", ...input });
    });
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(jest.mocked(axios.post).mock.calls.at(-1)?.[0]).toContain(`/goals/${endpoint}`);
  } finally {
    unmount();
    client.clear();
    jest.clearAllMocks();
  }
});
