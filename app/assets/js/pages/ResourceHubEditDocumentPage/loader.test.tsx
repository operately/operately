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
  const inputs = await loader({ params: { id: "doc1" } });
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

  expect(axios.get).toHaveBeenCalledTimes(1);
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
