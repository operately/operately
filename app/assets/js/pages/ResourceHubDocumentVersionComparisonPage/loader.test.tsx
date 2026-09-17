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
jest.mock("react-router", () => ({ redirect: (path: string) => new Error(path) }));

const document = {
  id: "doc1",
  name: "Document",
  content: "",
  resourceHubId: "hub1",
  parentFolderId: "folder1",
};
const response = {
  document,
  resourceHub: { id: "hub1" },
  folder: { id: "folder1" },
  versions: [],
  subscribed: false,
};

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
  const inputs = await loader({ params: { id: "doc1", companyId: "company1", versionNumber: "2" } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);

  return inputs;
}

it("prefetches and subscribes without duplicate requests on mount or cached route re-entry", async () => {
  const inputs = await visit();
  expect(inputs).not.toHaveProperty("document");

  const { result, unmount } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.document.name).toBe("Document");
  expect(result.current.document.content).toBe("");

  unmount();
  await visit();
  renderHook(useLoadedData, { initialProps: undefined, wrapper });

  expect(axios.get).toHaveBeenCalledTimes(3);
});

it("updates after invalidation and keeps cached content after a background failure", async () => {
  await visit();
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });

  jest.mocked(axios.get).mockResolvedValue({ data: { ...response, document: { ...document, name: "Updated" } } });
  await act(() => queryClient.invalidateQueries({ queryKey: Api.documents.getQueryKeyPrefix() }));
  await waitFor(() => expect(result.current.document.name).toBe("Updated"));

  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  await act(() => queryClient.invalidateQueries({ queryKey: Api.documents.getQueryKeyPrefix() }));

  expect(result.current.document.name).toBe("Updated");
});

it("guards unavailable cached document data", async () => {
  const { documentInput } = await visit();
  queryClient.setQueryData(Api.documents.getQueryKey(documentInput), { document: null });
  const log = jest.spyOn(console, "error").mockImplementation(() => {});

  try {
    expect(() => renderHook(useLoadedData, { initialProps: undefined, wrapper })).toThrow(/Document data/);
  } finally {
    log.mockRestore();
  }
});

it("rejects a document without a resource hub before requesting its parents", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { ...response, document: { ...document, resourceHubId: null } } });

  await expect(visit()).rejects.toThrow(/resource hub/);
  expect(axios.get).not.toHaveBeenCalledWith(expect.stringContaining("/resource_hubs/"), expect.anything());
});

it("starts independent queries before the document request finishes", async () => {
  let resolveDocument: (value: { data: typeof response }) => void = () => {};
  jest.mocked(axios.get).mockImplementation((url) => {
    if (url.endsWith("/documents/get")) {
      return new Promise((resolve) => {
        resolveDocument = resolve;
      });
    }

    return Promise.resolve({ data: response });
  });

  const pending = visit();
  await waitFor(() =>
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/documents/list_versions"), expect.anything()),
  );

  resolveDocument({ data: response });
  await pending;
});

it("guards unavailable cached hub data", async () => {
  const { hubInput } = await visit();
  queryClient.setQueryData(Api.resource_hubs.getQueryKey(hubInput), { resourceHub: null });
  const log = jest.spyOn(console, "error").mockImplementation(() => {});

  try {
    expect(() => renderHook(useLoadedData, { initialProps: undefined, wrapper })).toThrow(/resource hub/);
  } finally {
    log.mockRestore();
  }
});

it.each(["1", "0", "invalid"])("redirects invalid comparison version %s before fetching", async (versionNumber) => {
  await expect(loader({ params: { id: "doc1", companyId: "company1", versionNumber } })).rejects.toThrow();
  expect(axios.get).not.toHaveBeenCalled();
});
