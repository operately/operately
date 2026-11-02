/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useProjectUpdates } from "./useProjectUpdates";
import {
  cancelProjectPageQueries,
  invalidateProjectPageQueries,
  invalidateProjectResourceHubQueries,
} from "./projectPageQueries";

let mockSignal: () => void;
let mockJoined: () => void;
jest.mock("@/signals", () => ({
  useProjectUpdatedSignal: (callback: () => void, _payload: unknown, joined: () => void) => {
    mockSignal = callback;
    mockJoined = joined;
  },
}));
jest.mock("./projectPageQueries", () => ({
  cancelProjectPageQueries: jest.fn().mockResolvedValue(undefined),
  invalidateProjectPageQueries: jest.fn().mockResolvedValue(undefined),
  invalidateProjectResourceHubQueries: jest.fn().mockResolvedValue(undefined),
}));

it("refreshes after joining and batches remote changes until local saves settle", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  const client = new QueryClient();
  const root = createRoot(document.createElement("div"));
  function Subscriber() {
    useProjectUpdates("project-1", "hub-1");
    return null;
  }
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Subscriber />
      </QueryClientProvider>,
    ),
  );
  await act(async () => {
    mockJoined();
    jest.runOnlyPendingTimers();
  });
  expect(invalidateProjectPageQueries).toHaveBeenLastCalledWith(client, "project-1", "active");
  expect(invalidateProjectResourceHubQueries).toHaveBeenLastCalledWith(client, "hub-1");
  jest.clearAllMocks();

  let finishSave: () => void = () => {};
  const saved = new Promise<void>((resolve) => {
    finishSave = resolve;
  });
  const mutation = client.getMutationCache().build(client, { mutationFn: () => saved });
  let saving: Promise<void>;
  await act(async () => {
    saving = mutation.execute(undefined);
  });
  await act(async () => {
    mockSignal();
    mockSignal();
    jest.runOnlyPendingTimers();
  });
  expect(invalidateProjectPageQueries).not.toHaveBeenCalled();
  await act(async () => {
    finishSave();
    await saving;
  });
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  expect(invalidateProjectPageQueries).toHaveBeenCalledTimes(1);

  mockSignal();
  await act(async () => root.unmount());
  jest.runOnlyPendingTimers();
  expect(invalidateProjectPageQueries).toHaveBeenCalledTimes(1);
  client.clear();
  jest.useRealTimers();
});

it("cancels an older refetch when a save starts and reconciles even if that save fails", async () => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  const client = new QueryClient();
  const root = createRoot(document.createElement("div"));
  let finishFetch: () => void = () => {};
  jest.mocked(invalidateProjectPageQueries).mockReturnValueOnce(
    new Promise<void>((resolve) => {
      finishFetch = resolve;
    }),
  );
  function Subscriber() {
    useProjectUpdates("project-1", "hub-1");
    return null;
  }
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Subscriber />
      </QueryClientProvider>,
    ),
  );
  await act(async () => {
    mockSignal();
    jest.runOnlyPendingTimers();
  });

  let failSave: (error: Error) => void = () => {};
  const saved = new Promise<void>((_resolve, reject) => {
    failSave = reject;
  });
  const mutation = client.getMutationCache().build(client, { mutationFn: () => saved });
  let saving: Promise<unknown>;
  await act(async () => {
    saving = mutation.execute(undefined).catch(() => undefined);
  });
  expect(cancelProjectPageQueries).toHaveBeenCalledWith(client, "project-1", "hub-1");
  await act(async () => {
    finishFetch();
    failSave(new Error("Save failed"));
    await saving;
  });
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  expect(invalidateProjectPageQueries).toHaveBeenCalledTimes(2);
  await act(async () => root.unmount());
  client.clear();
  jest.useRealTimers();
});
