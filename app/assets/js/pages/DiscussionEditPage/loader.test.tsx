/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { loader, useLoadedData } from "./loader";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
});

afterEach(() => queryClient.clear());

it("reads prefetched records from the cache without a duplicate request", async () => {
  jest.mocked(axios.get).mockResolvedValue({
    data: {
      discussion: { id: "resource1", title: "Discussion", space: { id: "space1" } },
      discussions: [],
      my_drafts: [],
    },
  });
  const inputs = await loader({ params: { id: "resource1" } });
  expect(inputs).not.toHaveProperty("discussion");
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.discussion.id).toBe("resource1");
  await loader({ params: { id: "resource1" } });
  expect(axios.get).toHaveBeenCalledTimes(1);
});

it("rejects missing required records", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: {} });
  const inputs = await loader({ params: { id: "resource1" } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    expect(() => renderHook(useLoadedData, { initialProps: undefined, wrapper })).toThrow(/unavailable/);
  } finally {
    error.mockRestore();
  }
});

it("subscribes to refreshed cache data and retains it after a failed background request", async () => {
  jest
    .mocked(axios.get)
    .mockResolvedValue({ data: { discussion: { id: "resource1", title: "Before", space: { id: "space1" } } } });
  const inputs = await loader({ params: { id: "resource1" } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  const queryKey = Api.spaces.getDiscussionQueryKey(inputs.queryInput);
  jest
    .mocked(axios.get)
    .mockResolvedValue({ data: { discussion: { id: "resource1", title: "Changed", space: { id: "space1" } } } });
  await act(() => queryClient.invalidateQueries({ queryKey }));
  await waitFor(() => expect(result.current.discussion.title).toBe("Changed"));

  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  await act(() => queryClient.invalidateQueries({ queryKey }));
  expect(result.current.discussion.title).toBe("Changed");
});
