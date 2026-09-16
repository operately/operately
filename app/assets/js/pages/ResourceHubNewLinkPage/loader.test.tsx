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

const response = { resourceHub: { id: "hub1", name: "Hub" }, folder: { id: "folder1", name: "Folder" } };
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

async function visit(search = "") {
  const inputs = await loader({ params: { id: "hub1" }, request: { url: `http://localhost/new${search}` } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);

  return inputs;
}

it("does not request a folder when creating at the hub root and reuses cached route data", async () => {
  const inputs = await visit();
  expect(inputs).not.toHaveProperty("resourceHub");

  const { result, unmount } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.resourceHub.name).toBe("Hub");
  expect(result.current.folder).toBeUndefined();

  unmount();
  await visit();
  renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(axios.get).toHaveBeenCalledTimes(1);
});

it("prefetches the hub and optional folder in parallel", async () => {
  const finish: ((value: unknown) => void)[] = [];
  jest.mocked(axios.get).mockImplementation(() => new Promise((resolve) => finish.push(resolve)));

  const pending = visit("?folderId=folder1");
  await waitFor(() => expect(finish).toHaveLength(2));
  finish.forEach((resolve) => resolve({ data: response }));
  await pending;

  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.folder?.id).toBe("folder1");
  expect(axios.get).toHaveBeenCalledTimes(2);
});

it("subscribes to changes and keeps cached data after background failures", async () => {
  await visit("?folderId=folder1");
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });

  jest.mocked(axios.get).mockResolvedValue({ data: { ...response, folder: { id: "folder1", name: "Renamed" } } });
  await act(() => queryClient.invalidateQueries());
  await waitFor(() => expect(result.current.folder?.name).toBe("Renamed"));

  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  await act(() => queryClient.invalidateQueries());

  expect(result.current.resourceHub.name).toBe("Hub");
  expect(result.current.folder?.name).toBe("Renamed");
});

it.each(["hub", "folder"])("guards unavailable %s data", async (missing) => {
  const inputs = await visit("?folderId=folder1");
  if (missing === "hub") {
    queryClient.setQueryData(Api.resource_hubs.getQueryKey(inputs.hubInput), { resourceHub: null });
  } else {
    queryClient.setQueryData(Api.resource_hubs.getFolderQueryKey({ id: "folder1", includePathToFolder: true }), {
      folder: null,
    });
  }
  const log = jest.spyOn(console, "error").mockImplementation(() => {});

  try {
    expect(() => renderHook(useLoadedData, { initialProps: undefined, wrapper })).toThrow(/unavailable/);
  } finally {
    log.mockRestore();
  }
});

it("preserves the requested link type", async () => {
  await visit("?type=figma");
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });

  expect(result.current.linkType).toBe("figma");
});
