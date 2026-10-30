/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api, { type ResourceHubDocument, type InlineThread } from "@/api";
import { renderHook, waitFor } from "@/__tests__/renderHook";
import { useDocumentInlineComments } from "./useInlineComments";

let mockSignedIn = true;
const mockNavigate = jest.fn();
let mockLocation = { key: "initial", pathname: "/documents/doc", search: "?inlineThread=thread", hash: "#message" };
jest.mock("react-router", () => ({ useLocation: () => mockLocation, useNavigate: () => mockNavigate }));
jest.mock("@/routes/useCompanyLoaderData", () => ({
  useCompanyLoaderData: () => ({
    company: { id: "company", enabledExperimentalFeatures: [] },
  }),
}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({
  useMe: () => (mockSignedIn ? { id: "me", fullName: "Maya", avatarUrl: null } : null),
}));
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    profilePrefix: "/people/",
    profilePath(id: string) {
      return this.profilePrefix + id;
    },
    resourceHubDocumentPath: () => "/documents/doc",
  }),
}));
jest.mock("@/hooks/useRichEditorHandlers", () => ({ useRichEditorHandlers: () => ({}) }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));

const document: ResourceHubDocument = {
  __typename: "resource_hub_document",
  id: "doc",
  resourceHubId: "hub",
  parentFolderId: "hub",
  name: "Launch review",
  content: JSON.stringify({ type: "doc", content: [] }),
  state: "published",
  currentVersion: 1,
  insertedAt: "2026-10-29T12:00:00Z",
  publishedAt: "2026-10-29T12:00:00Z",
  updatedAt: "2026-10-29T12:00:00Z",
  permissions: { __typename: "resource_hub_permissions", canCommentOnDocument: true },
};
const thread: InlineThread = {
  __typename: "inline_thread",
  id: "thread",
  resourceType: "resource_hub_document",
  resourceId: "doc",
  author: null,
  resolvedAt: null,
  resolvedBy: null,
  insertedAt: "2026-10-29T12:00:00Z",
  anchor: {
    __typename: "inline_anchor",
    sourceVersion: 1,
    sourceFrom: 1,
    sourceTo: 6,
    quote: "Hello",
    prefix: "",
    suffix: " world",
    currentVersion: 1,
    currentFrom: 1,
    currentTo: 6,
    status: "attached",
  },
  messages: [{ __typename: "comment", id: "message" }],
};
let client: QueryClient;
let fetchThreads: jest.Mock;
function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  mockSignedIn = true;
  mockLocation = { key: "initial", pathname: "/documents/doc", search: "?inlineThread=thread", hash: "#message" };
  mockNavigate.mockClear();
  Api.default.setBasePath("/api/v2");
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  fetchThreads = jest.fn(async () => ({ threads: [thread] }));
  const options = Api.inline_threads.listQueryOptions;
  jest
    .spyOn(Api.inline_threads, "listQueryOptions")
    .mockImplementation((input) => ({ ...options(input), queryFn: fetchThreads }));
});
afterEach(() => {
  client.clear();
  jest.restoreAllMocks();
});

it.each(["signed-out", "draft", "published"])(
  "only fetches threads for signed-in users viewing published documents, without feature flags: %s",
  async (state) => {
    mockSignedIn = state !== "signed-out";
    const doc: ResourceHubDocument = state === "draft" ? { ...document, state: "draft" } : document;
    const { result } = renderHook(() => ({ inline: useDocumentInlineComments(doc) }), {
      wrapper: Wrapper,
      initialProps: undefined,
    });
    if (state === "published") {
      await waitFor(() => expect(result.current.inline?.threads).toHaveLength(1));
      expect(fetchThreads).toHaveBeenCalledTimes(1);
      expect(result.current.inline?.getProfileLink("maya")).toBe("/people/maya");
      expect(result.current.inline?.getThreadLink("thread", "message")).toContain("?inlineThread=thread#message");
    } else {
      expect(result.current.inline).toBeUndefined();
      expect(fetchThreads).not.toHaveBeenCalled();
    }
  },
);

it("returns a version conflict and refreshes the document without navigating", async () => {
  const mutationFn = jest.fn(async () => {
    throw { isAxiosError: true, response: { data: { details: { reason: "version_conflict" } } } };
  });
  jest.spyOn(Api.inline_threads, "createMutationOptions").mockReturnValue({ mutationFn });
  const documentKey = Api.documents.getQueryKey({ id: "doc" });
  client.setQueryData(documentKey, { document });
  const { result } = renderHook(() => ({ inline: useDocumentInlineComments(document) }), {
    wrapper: Wrapper,
    initialProps: undefined,
  });
  await waitFor(() => expect(result.current.inline?.loading).toBe(false));
  await act(async () => {
    expect(
      await result.current.inline?.onCreate({ from: 1, to: 6, quote: "Hello", sourceVersion: 1 }, { type: "doc" }),
    ).toBe("conflict");
  });
  expect(client.getQueryState(documentKey)?.isInvalidated).toBe(true);
  expect(mockNavigate).not.toHaveBeenCalled();
});

it.each(["thread", null])("does not navigate when the selected thread is already %s", async (id) => {
  mockLocation = { ...mockLocation, search: id ? `?inlineThread=${id}` : "" };
  const { result } = renderHook(() => useDocumentInlineComments(document), {
    wrapper: Wrapper,
    initialProps: undefined,
  });
  await waitFor(() => expect(result.current?.loading).toBe(false));
  act(() => result.current?.onSelectThread(id));
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(fetchThreads).toHaveBeenCalledTimes(1);
});

it("clears a deleted empty thread selection while preserving the ordinary comment hash", async () => {
  jest
    .spyOn(Api.inline_threads, "deleteMessageMutationOptions")
    .mockReturnValue({ mutationFn: async () => ({ thread: null }) });
  const { result } = renderHook(() => ({ inline: useDocumentInlineComments(document) }), {
    wrapper: Wrapper,
    initialProps: undefined,
  });
  await waitFor(() => expect(result.current.inline?.threads).toHaveLength(1));
  await act(async () => {
    await result.current.inline?.onDeleteMessage("message");
  });
  expect(mockNavigate).toHaveBeenCalledWith(
    { pathname: "/documents/doc", search: "", hash: "#message" },
    expect.anything(),
  );
});

describe.each(["create", "delete"] as const)("pending %s navigation", (action) => {
  it.each(["unchanged", "unmounted", "other-document", "other-thread", "returned"])(
    "only updates the URL if the original page is still current: %s",
    async (destination) => {
      let finish = () => {};
      const pending = new Promise<void>((resolve) => {
        finish = resolve;
      });
      const create = jest.fn(async () => {
        await pending;
        return { thread: { ...thread, id: "new-thread" } };
      });
      const remove = jest.fn(async () => {
        await pending;
        return { thread: null };
      });
      jest.spyOn(Api.inline_threads, "createMutationOptions").mockReturnValue({ mutationFn: create });
      jest.spyOn(Api.inline_threads, "deleteMessageMutationOptions").mockReturnValue({ mutationFn: remove });
      const view = renderHook((doc) => ({ inline: useDocumentInlineComments(doc) }), {
        wrapper: Wrapper,
        initialProps: document,
      });
      await waitFor(() => expect(view.result.current.inline?.threads).toHaveLength(1));
      let completion: Promise<unknown> | undefined;
      act(() => {
        completion =
          action === "create"
            ? view.result.current.inline?.onCreate(
                { from: 1, to: 6, quote: "Hello", sourceVersion: 1 },
                { type: "doc" },
              )
            : view.result.current.inline?.onDeleteMessage("message");
      });
      await waitFor(() => expect(action === "create" ? create : remove).toHaveBeenCalledTimes(1));

      if (destination === "unmounted") view.unmount();
      if (destination === "other-document") {
        mockLocation = { ...mockLocation, key: "next", pathname: "/documents/other" };
        view.rerender({ ...document, id: "other" });
      }
      if (destination === "other-thread") {
        mockLocation = { ...mockLocation, key: "next", search: "?inlineThread=other" };
        view.rerender(document);
      }
      if (destination === "returned") {
        const original = mockLocation;
        mockLocation = { ...mockLocation, key: "away", pathname: "/documents/other" };
        view.rerender({ ...document, id: "other" });
        mockLocation = { ...original, key: "returned" };
        view.rerender(document);
      }

      await act(async () => {
        finish();
        await completion;
      });
      if (destination === "unchanged") {
        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(
          {
            pathname: "/documents/doc",
            search: action === "create" ? "inlineThread=new-thread" : "",
            hash: "#message",
          },
          { replace: true, preventScrollReset: true },
        );
      } else {
        expect(mockNavigate).not.toHaveBeenCalled();
      }
    },
  );
});

it("uses preloaded threads on the first render without refetching on mount", () => {
  client.setQueryData(
    Api.inline_threads.listQueryKey({
      resourceType: "resource_hub_document",
      resourceId: document.id,
    }),
    { threads: [thread] },
  );
  const { result } = renderHook(() => useDocumentInlineComments(document), {
    wrapper: Wrapper,
    initialProps: undefined,
  });
  expect(result.current?.threads).toEqual([thread]);
  expect(result.current?.loading).toBe(false);
  expect(fetchThreads).not.toHaveBeenCalled();
});
