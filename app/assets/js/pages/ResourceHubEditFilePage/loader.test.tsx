/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Pages from "@/components/Pages";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { loader, useLoadedData } from "./loader";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));
jest.mock("react-router", () => ({}));

const resource = { id: "resource1", name: "Original", resourceHubId: "hub1" };
const response = { file: resource, subscribed: false };
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
  jest.mocked(axios.get).mockResolvedValue({ data: response });
});

afterEach(() => queryClient.clear());

async function visit() {
  const inputs = await loader({ params: { id: resource.id } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);

  return inputs;
}

it("subscribes to prefetched data without duplicate mount or route re-entry requests", async () => {
  const inputs = await visit();
  expect(inputs).not.toHaveProperty("file");

  const { result, unmount } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.file.name).toBe("Original");

  unmount();
  await visit();
  renderHook(useLoadedData, { initialProps: undefined, wrapper });

  expect(axios.get).toHaveBeenCalledTimes(1);
});

it("updates on invalidation and retains data after a failed background refresh", async () => {
  await visit();
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });

  jest.mocked(axios.get).mockResolvedValue({ data: { ...response, file: { ...resource, name: "Updated" } } });
  await act(() => queryClient.invalidateQueries({ queryKey: Api.files.getQueryKeyPrefix() }));
  await waitFor(() => expect(result.current.file.name).toBe("Updated"));

  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  await act(() => queryClient.invalidateQueries({ queryKey: Api.files.getQueryKeyPrefix() }));

  expect(result.current.file.name).toBe("Updated");
});

it("guards missing resource data", async () => {
  const inputs = await visit();
  queryClient.setQueryData(Api.files.getQueryKey(inputs.fileInput), { file: null });
  const log = jest.spyOn(console, "error").mockImplementation(() => {});

  try {
    expect(() => renderHook(useLoadedData, { initialProps: undefined, wrapper })).toThrow(/data is unavailable/);
  } finally {
    log.mockRestore();
  }
});
