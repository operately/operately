/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Pages from "@/components/Pages";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { loader, useLoadedData, useRefresh } from "./loader";

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
  company: { enabledExperimentalFeatures: [] },
  threads: [],
};

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  window.appConfig = { billingEnabled: false } as typeof window.appConfig;
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

  expect(axios.get).toHaveBeenCalledTimes(5);
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

it("does not fetch a folder for a document at the hub root", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { ...response, document: { ...document, parentFolderId: null } } });
  await visit();

  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });

  expect(result.current.folder).toBeUndefined();
  expect(result.current.isCurrentUserSubscribed).toBe(false);
  expect(axios.get).toHaveBeenCalledTimes(4);
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
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/notifications/is_subscribed"), expect.anything()),
  );

  resolveDocument({ data: response });
  await pending;
});

it("refreshes the page's queries while preserving unrelated cached documents", async () => {
  await visit();
  const unrelatedKey = Api.documents.getQueryKey({ id: "other" });
  queryClient.setQueryData(unrelatedKey, { document });
  const { result } = renderHook(() => ({ page: useLoadedData(), refresh: useRefresh() }), {
    initialProps: undefined,
    wrapper,
  });

  jest.mocked(axios.get).mockResolvedValue({
    data: {
      ...response,
      document: { ...document, name: "Refreshed" },
      subscribed: true,
      versions: [{ id: "version1" }],
    },
  });
  await act(() => result.current.refresh());
  await waitFor(() => expect(result.current.page.document.name).toBe("Refreshed"));

  expect(result.current.page.isCurrentUserSubscribed).toBe(true);
  expect(queryClient.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
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

it("waits for inline comments before completing the loader", async () => {
  let finishThreads: (value: { data: { threads: { id: string }[] } }) => void = () => {};
  jest.mocked(axios.get).mockImplementation((url) => {
    if (url.endsWith("/inline_threads/list")) {
      return new Promise((resolve) => {
        finishThreads = resolve;
      });
    }
    return Promise.resolve({
      data: {
        ...response,
        document: { ...document, state: "published" },
        company: { enabledExperimentalFeatures: ["document_inline_comments"] },
      },
    });
  });
  const finished = jest.fn();
  const pending = visit().then(finished);
  await waitFor(() =>
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/inline_threads/list"), expect.anything()),
  );
  expect(finished).not.toHaveBeenCalled();
  finishThreads({ data: { threads: [{ id: "thread1" }] } });
  await pending;
  expect(
    queryClient.getQueryData(
      Api.inline_threads.listQueryKey({
        resourceType: "resource_hub_document",
        resourceId: "doc1",
      }),
    ),
  ).toEqual({ threads: [{ id: "thread1" }] });
});

it("loads new replies when revisiting a document with cached threads", async () => {
  const thread = { id: "thread1", messages: [{ id: "message1" }] };
  const publishedResponse = {
    ...response,
    document: { ...document, state: "published" },
    company: { enabledExperimentalFeatures: ["document_inline_comments"] },
    threads: [thread],
  };
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("/inline_threads/list") ? { threads: [thread] } : publishedResponse,
  }));
  await visit();

  const updatedThread = { ...thread, messages: [...thread.messages, { id: "reply1" }] };
  jest.mocked(axios.get).mockClear();
  jest.mocked(axios.get).mockResolvedValue({ data: { threads: [updatedThread] } });
  await visit();

  expect(
    queryClient.getQueryData(
      Api.inline_threads.listQueryKey({ resourceType: "resource_hub_document", resourceId: "doc1" }),
    ),
  ).toEqual({ threads: [updatedThread] });
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/inline_threads/list"), expect.anything());
});

it.each(["disabled", "draft"])("does not preload inline comments for %s documents", async (state) => {
  jest.mocked(axios.get).mockResolvedValue({
    data: {
      ...response,
      document: { ...document, state: state === "draft" ? "draft" : "published" },
      company: { enabledExperimentalFeatures: state === "disabled" ? [] : ["document_inline_comments"] },
    },
  });
  await visit();
  expect(axios.get).not.toHaveBeenCalledWith(expect.stringContaining("/inline_threads/list"), expect.anything());
});
