/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api, { type ResourceHubDocument, type InlineThread } from "@/api";
import { renderHook, waitFor } from "@/__tests__/renderHook";
import { useDocumentInlineComments } from "./useInlineComments";

let mockEnabled = true;
const mockNavigate = jest.fn();
const mockLocation = { pathname: "/documents/doc", search: "?inlineThread=thread", hash: "#message" };
jest.mock("react-router", () => ({ useLocation: () => mockLocation, useNavigate: () => mockNavigate }));
jest.mock("@/routes/useCompanyLoaderData", () => ({
  useCompanyLoaderData: () => ({
    company: { id: "company", enabledExperimentalFeatures: mockEnabled ? ["document_inline_comments"] : [] },
  }),
}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({
  useMe: () => ({ id: "me", fullName: "Maya", avatarUrl: null }),
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
  mockEnabled = true;
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

it.each(["disabled", "draft", "published"])(
  "only fetches threads on enabled published documents: %s",
  async (state) => {
    mockEnabled = state !== "disabled";
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
