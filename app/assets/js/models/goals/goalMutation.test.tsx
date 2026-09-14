/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { useGoalMutation } from "./goalMutation";

jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));

function setup(invalidate: () => Promise<void>) {
  const client = new QueryClient();
  return renderHook(
    () => useGoalMutation({ mutationFn: async (_input: { goalId: string }) => ({ success: true }) }, invalidate),
    {
      initialProps: undefined,
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    },
  );
}

it("waits for invalidation before completing a successful save", async () => {
  let finish = () => {};
  const refreshing = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const invalidate = jest.fn(() => refreshing);
  const { result } = setup(invalidate);
  const completed = jest.fn();
  let saving: Promise<unknown>;
  act(() => {
    saving = result.current.mutateAsync({ goalId: "goal1" }).then(completed);
  });
  await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1));
  expect(completed).not.toHaveBeenCalled();
  await act(async () => {
    finish();
    await saving;
  });
  expect(completed).toHaveBeenCalledWith({ success: true });
});

it("preserves an accepted save when refreshing fails", async () => {
  const { result } = setup(async () => {
    throw new Error("Refresh unavailable");
  });
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await act(async () => {
      await expect(result.current.mutateAsync({ goalId: "goal1" })).resolves.toEqual({ success: true });
    });
    expect(log).toHaveBeenCalledWith("Failed to refresh goal queries", expect.any(Error));
  } finally {
    log.mockRestore();
  }
});
