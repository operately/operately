/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api, { type Comment, type Person } from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLoadedQuery } from "@/api/queryClient";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useReloadCommentsSignal } from "@/signals";
import { CommentSection, type CommentSectionProps, showErrorToast } from "turboui";
import { KpiEntryComments } from "./KpiEntryComments";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("react-router", () => ({}));
jest.mock("@/routes/paths", () => ({
  compareIds: jest.requireActual("@/routes/paths").compareIds,
  usePaths: () => ({}),
}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "me", fullName: "Me" }) }));
jest.mock("@/models/people", () => ({ parsePersonForTurboUi: (_paths, person) => person }));
jest.mock("@/signals", () => ({ useReloadCommentsSignal: jest.fn(), publish: jest.fn(), LocalSignal: {} }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("@/hooks/useRichEditorHandlers", () => ({ useRichEditorHandlers: jest.fn(() => ({})) }));
jest.mock("turboui", () => ({ CommentSection: jest.fn(() => null), showErrorToast: jest.fn() }));

let client: QueryClient;
let comments: Comment[];
const commentKey = () => Api.comments.listQueryKey({ entityId: "entry1", entityType: "kpi_entry" });
const kpiKey = () => Api.kpis.getKpiQueryKey({ kpiId: "kpi1" });
const listKey = () => Api.kpis.listKpisQueryKey({ spaceId: "space1" });

function savedComment(content = "{}"): Comment {
  return {
    __typename: "comment",
    id: "comment1",
    content,
    author: { id: "me", fullName: "Me" } as Person,
    insertedAt: "2026-09-22T12:00:00Z",
    reactions: [],
  };
}

function kpi() {
  const entry = { id: "entry1", commentsCount: comments.length };
  return { id: "kpi1", entries: [entry], latestEntry: entry };
}

beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  comments = [];
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("/comments/list") ? { comments } : url.endsWith("/get_kpi") ? { kpi: kpi() } : { kpis: [kpi()] },
  }));
  jest.mocked(axios.post).mockImplementation(async (url, input) => {
    const { content } = input as { content?: string };
    if (url.endsWith("/comments/create")) {
      const comment = savedComment(content);
      comments = [...comments, comment];
      return { data: { comment } };
    }
    if (url.endsWith("/comments/delete")) comments = [];
    if (url.endsWith("/comments/update")) {
      comments = comments.map((comment) => ({ ...comment, content }));
      return { data: { comment: comments[0] } };
    }
    return { data: {} };
  });
});
afterEach(() => client.clear());

function mount(canComment = true) {
  client.setQueryData(kpiKey(), { kpi: kpi() });
  client.setQueryData(listKey(), { kpis: [kpi()] });
  return renderHook(
    () => ({
      detail: useLoadedQuery(Api.kpis.getKpiQueryOptions({ kpiId: "kpi1" })),
      list: useLoadedQuery(Api.kpis.listKpisQueryOptions({ spaceId: "space1" })),
    }),
    {
      initialProps: undefined,
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>
          <KpiEntryComments entryId="entry1" kpiId="kpi1" spaceId="space1" canComment={canComment} />
          {children}
        </QueryClientProvider>
      ),
    },
  );
}

function props(): CommentSectionProps {
  const value = jest.mocked(CommentSection).mock.calls.at(-1)?.[0];
  if (!value) throw new Error("Comment section has not rendered");
  return value;
}

async function loaded() {
  await waitFor(() => expect(client.getQueryState(commentKey())?.status).toBe("success"));
}

it.each([true, false])("preserves the entry type, space mentions, drafts, and canComment=%s", async (canComment) => {
  comments = [savedComment()];
  mount(canComment);
  await loaded();
  await waitFor(() => expect(props().items).toHaveLength(1));
  expect(props().canComment).toBe(canComment);
  expect(props().commentParentType).toBe("kpi_entry");
  expect(props().commentDraftKey).toBe("kpi_entry:entry1:new-comment");
  expect(props().editCommentDraftKey?.("comment1")).toBe("kpi_entry:entry1:edit-comment:comment1");
  expect(useRichEditorHandlers).toHaveBeenCalledWith({ scope: { type: "space", id: "space1" } });
});

it("updates detail and list counts after creating and deleting a comment", async () => {
  const { result } = mount();
  await loaded();
  await act(async () => expect(await props().onAddComment({ text: "Hello" })).toBe(true));
  expect(axios.post).toHaveBeenCalledWith(
    "/api/v2/comments/create",
    {
      entity_id: "entry1",
      entity_type: "kpi_entry",
      content: '{"text":"Hello"}',
    },
    expect.anything(),
  );
  await waitFor(() => expect(result.current.detail.data?.kpi.entries?.[0]?.commentsCount).toBe(1));
  expect(result.current.list.data?.kpis[0]?.latestEntry?.commentsCount).toBe(1);
  await act(() => props().onDeleteComment?.("comment1"));
  await waitFor(() => expect(result.current.detail.data?.kpi.entries?.[0]?.commentsCount).toBe(0));
  expect(result.current.list.data?.kpis[0]?.latestEntry?.commentsCount).toBe(0);
  expect(props().items).toHaveLength(0);
});

it("shows a pending comment and rolls it back on failure without changing counts or drafts", async () => {
  const { result } = mount();
  await loaded();
  let reject = (_reason: Error) => {};
  jest.mocked(axios.post).mockImplementationOnce(() => new Promise((_resolve, fail) => (reject = fail)));
  let adding: Promise<boolean | void>;
  await act(async () => {
    adding = Promise.resolve(props().onAddComment({ text: "Draft" }));
  });
  expect(props().items).toHaveLength(1);
  expect(props().items[0]?.value.id).toMatch(/^temp-/);
  expect(props().submitting).toBe(true);
  await act(async () => {
    reject(new Error("Offline"));
    expect(await adding).toBe(false);
  });
  expect(props().items).toHaveLength(0);
  expect(props().commentDraftKey).toBe("kpi_entry:entry1:new-comment");
  expect(result.current.detail.data?.kpi.entries?.[0]?.commentsCount).toBe(0);
  expect(result.current.list.data?.kpis[0]?.latestEntry?.commentsCount).toBe(0);
  expect(showErrorToast).toHaveBeenCalled();
});

it("restores a failed optimistic deletion and keeps the recorded count", async () => {
  comments = [savedComment()];
  const { result } = mount();
  await loaded();
  await waitFor(() => expect(props().items).toHaveLength(1));
  let reject = (_reason: Error) => {};
  jest.mocked(axios.post).mockImplementationOnce(() => new Promise((_resolve, fail) => (reject = fail)));
  let deleting: Promise<void> | undefined;
  await act(async () => {
    deleting = Promise.resolve(props().onDeleteComment?.("comment1"));
  });
  expect(props().items).toHaveLength(0);
  await act(async () => {
    reject(new Error("Offline"));
    await deleting;
  });
  expect(props().items).toHaveLength(1);
  expect(result.current.detail.data?.kpi.entries?.[0]?.commentsCount).toBe(1);
  expect(result.current.list.data?.kpis[0]?.latestEntry?.commentsCount).toBe(1);
});

it("edits with the KPI parent type and refreshes externally added comments and counts", async () => {
  comments = [savedComment()];
  const { result } = mount();
  await loaded();
  await waitFor(() => expect(props().items).toHaveLength(1));
  await act(async () => expect(await props().onEditComment("comment1", { edited: true })).toBe(true));
  expect(axios.post).toHaveBeenCalledWith(
    "/api/v2/comments/update",
    {
      comment_id: "comment1",
      parent_type: "kpi_entry",
      content: '{"edited":true}',
    },
    expect.anything(),
  );
  comments = [...comments, { ...savedComment(), id: "comment2" }];
  await act(async () => {
    jest.mocked(useReloadCommentsSignal).mock.calls.at(-1)?.[0]();
  });
  await waitFor(() => expect(props().items).toHaveLength(2));
  expect(result.current.detail.data?.kpi.entries?.[0]?.commentsCount).toBe(2);
  expect(result.current.list.data?.kpis[0]?.latestEntry?.commentsCount).toBe(2);
});

it("preserves a successful write when refreshing fails and recovers counts on retry", async () => {
  const { result } = mount();
  await loaded();
  const originalGet = jest.mocked(axios.get).getMockImplementation();
  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await act(async () => expect(await props().onAddComment({ text: "Saved" })).toBe(true));
    expect(props().items).toHaveLength(1);
    expect(props().items[0]?.value.id).toBe("comment1");
    expect(result.current.detail.data?.kpi.entries?.[0]?.commentsCount).toBe(0);
    if (!originalGet) throw new Error("Missing query mock");
    jest.mocked(axios.get).mockImplementation(originalGet);
    await act(async () => {
      jest.mocked(useReloadCommentsSignal).mock.calls.at(-1)?.[0]();
    });
    await waitFor(() => expect(result.current.detail.data?.kpi.entries?.[0]?.commentsCount).toBe(1));
    expect(result.current.list.data?.kpis[0]?.latestEntry?.commentsCount).toBe(1);
  } finally {
    log.mockRestore();
  }
});

it("reads comment notifications through TanStack without refetching the thread", async () => {
  comments = [{ ...savedComment(), notification: { id: "notification1", read: false } } as Comment];
  mount();
  await loaded();
  await waitFor(() => expect(props().items).toHaveLength(1));
  const reads = jest.mocked(axios.get).mock.calls.length;
  await act(async () => {
    await props().onCommentVisible?.("comment1");
    await props().onCommentVisible?.("comment1");
  });
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledWith(
    "/api/v2/notifications/mark_many_as_read",
    { ids: ["notification1"] },
    expect.anything(),
  );
  expect(axios.get).toHaveBeenCalledTimes(reads);
  expect(client.getQueryState(commentKey())?.isInvalidated).toBe(true);
});

it("keeps the KPI parent type when adding comment reactions", async () => {
  comments = [savedComment()];
  const { result } = mount();
  await loaded();
  await waitFor(() => expect(props().items).toHaveLength(1));
  const reaction = {
    __typename: "reaction" as const,
    id: "reaction1",
    emoji: "🎉",
    person: comments[0]?.author ?? null,
  };
  jest.mocked(axios.post).mockImplementationOnce(async () => {
    comments = comments.map((comment) => ({ ...comment, reactions: [reaction] }));
    return { data: { reaction } };
  });
  await act(() => props().onAddReaction?.("comment1", "🎉"));
  expect(axios.post).toHaveBeenCalledWith(
    "/api/v2/reactions/create",
    {
      entity_id: "comment1",
      entity_type: "comment",
      parent_type: "kpi_entry",
      emoji: "🎉",
    },
    expect.anything(),
  );
  const item = props().items[0];
  expect(item?.type === "comment" && item.value.reactions[0]?.id).toBe("reaction1");
  expect(result.current.detail.data?.kpi.entries?.[0]?.commentsCount).toBe(1);
});
