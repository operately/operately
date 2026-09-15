/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { invalidateDiscussionDetailQueries } from "@/models/discussions/discussionQueries";
import { loader, useLoadedData } from "./loader";

jest.mock("axios");
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));

const discussion = {
  id: "discussion1",
  title: "Before",
  body: null,
  space: { id: "space1" },
  permissions: { can_edit: true },
};

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  jest.mocked(axios.get).mockResolvedValue({ data: { discussion, subscribed: true } });
});

afterEach(() => queryClient.clear());
async function visit() {
  const inputs = await loader({ params: { id: "discussion1" } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  return inputs;
}

it("prefetches discussion and message subscription in parallel, without duplicate mount requests", async () => {
  const finish: ((value: unknown) => void)[] = [];
  jest.mocked(axios.get).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish.push(resolve);
      }),
  );
  const loading = visit();
  await waitFor(() => expect(finish).toHaveLength(2));
  finish.forEach((resolve) => resolve({ data: { discussion, subscribed: true } }));
  const inputs = await loading;
  expect(inputs).not.toHaveProperty("discussion");
  expect(inputs.subscriptionInput).toEqual({ resourceId: "discussion1", resourceType: "message" });
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.discussion.body).toBeNull();
  expect(result.current.isCurrentUserSubscribed).toBe(true);
  await visit();
  expect(axios.get).toHaveBeenCalledTimes(2);
});

it("refreshes subscribed details and subscription status together", async () => {
  await visit();
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  jest
    .mocked(axios.get)
    .mockResolvedValue({ data: { discussion: { ...discussion, title: "After" }, subscribed: false } });
  await act(() => invalidateDiscussionDetailQueries(queryClient, "old-discussion1"));
  await waitFor(() => expect(result.current.discussion.title).toBe("After"));
  expect(result.current.isCurrentUserSubscribed).toBe(false);
});

it("keeps cached discussion and subscription data visible when a background refetch fails", async () => {
  await visit();
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  await act(() => invalidateDiscussionDetailQueries(queryClient, "discussion1"));
  expect(result.current.discussion.title).toBe("Before");
  expect(result.current.isCurrentUserSubscribed).toBe(true);
});

it("fetches fresh details when returning to an invalidated cached route", async () => {
  await visit();
  await invalidateDiscussionDetailQueries(queryClient, "discussion1");
  jest
    .mocked(axios.get)
    .mockResolvedValue({ data: { discussion: { ...discussion, title: "After" }, subscribed: false } });
  await visit();
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.discussion.title).toBe("After");
  expect(axios.get).toHaveBeenCalledTimes(4);
});

it.each([
  [undefined, /Discussion data/],
  [{ ...discussion, space: null }, /Discussion space/],
  [{ ...discussion, space: {} }, /Discussion space/],
  [{ ...discussion, permissions: null }, /Discussion permissions/],
])("rejects missing required discussion data (%#)", async (value, message) => {
  jest.mocked(axios.get).mockResolvedValue({ data: { discussion: value, subscribed: true } });
  await visit();
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    expect(() => renderHook(useLoadedData, { initialProps: undefined, wrapper })).toThrow(message);
  } finally {
    error.mockRestore();
  }
});
