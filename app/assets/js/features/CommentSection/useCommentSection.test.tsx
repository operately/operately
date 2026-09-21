/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api, { type Comment, type Person, type CommentsUpdateInput } from "@/api";
import { useCommentSection } from "./useCommentSection";
import { renderHook, waitFor } from "@/__tests__/renderHook";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useReloadCommentsSignal } from "@/signals";
import { type CommentQueryInvalidator } from "@/models/comments/commentLifecycle";

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
jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));

const commentTypes = [
  "goal_update",
  "goal_discussion",
  "project_check_in",
  "project_discussion",
  "project_retrospective",
  "message",
] as const;

it.each(commentTypes)(
  "preserves ordering, acknowledgements and drafts while editing %s comments",
  async (resourceType) => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({});

    const client = new QueryClient();

    const readNotification = jest.fn().mockResolvedValue({});
    jest.spyOn(Api.notifications, "markManyAsReadMutationOptions").mockReturnValue({ mutationFn: readNotification });

    const mentionSearchScope = { type: "project" as const, id: "project1" };
    const invalidateQueries = jest.fn<ReturnType<CommentQueryInvalidator>, Parameters<CommentQueryInvalidator>>(
      async (queryClient, refetchType) => {
        await queryClient.invalidateQueries({ queryKey: key, refetchType });
      },
    );

    const person = { id: "me", fullName: "Me" } as Person;
    let comments = [
      {
        id: "earlier",
        insertedAt: "2026-09-10T10:00:00Z",
        content: "{}",
        author: person,
        notification: { id: "notification1", read: false },
      },
      { id: "later", insertedAt: "2026-09-10T12:00:00Z", content: "{}", author: person },
    ] as Comment[];

    const options = Api.comments.listQueryOptions;
    jest
      .spyOn(Api.comments, "listQueryOptions")
      .mockImplementation((input) => ({ ...options(input), queryFn: async () => ({ comments }) }));

    const update = jest.fn(async (_input: CommentsUpdateInput) => {
      comments = comments.map((c) => (c.id === "earlier" ? { ...c, content: '{"edited":true}' } : c));
      const comment = comments.find((comment) => comment.id === "earlier");
      if (!comment) throw new Error("Missing test comment");

      return { comment };
    });
    jest.spyOn(Api.comments, "updateMutationOptions").mockReturnValue({ mutationFn: update });

    const result: { props: ReturnType<typeof useCommentSection> } = { props: null };

    function Harness() {
      result.props = useCommentSection({
        entity: { id: "resource1", type: resourceType },
        mentionSearchScope,
        invalidateQueries,
        canComment: true,
        acknowledgedAt: "2026-09-10T11:00:00Z",
        acknowledgedBy: person,
      });

      return null;
    }

    const key = Api.comments.listQueryKey({ entityId: "resource1", entityType: resourceType });
    client.setQueryData(key, { comments });

    const other = Api.comments.listQueryKey({ entityId: "resource2", entityType: resourceType });
    client.setQueryData(other, { comments: [] });

    const otherType = Api.comments.listQueryKey({ entityId: "resource1", entityType: "project_task" });
    client.setQueryData(otherType, { comments: [] });

    const root = createRoot(document.createElement("div"));

    try {
      await act(async () =>
        root.render(
          <QueryClientProvider client={client}>
            <Harness />
          </QueryClientProvider>,
        ),
      );

      expect(result.props?.items.map((i) => i.type)).toEqual(["comment", "acknowledgment", "comment"]);
      expect(result.props?.items.filter((i) => i.type === "comment").map((i) => i.value.id)).toEqual([
        "earlier",
        "later",
      ]);

      expect(useRichEditorHandlers).toHaveBeenCalledWith({ scope: mentionSearchScope });
      expect(result.props?.editCommentDraftKey?.("earlier")).toBe(`${resourceType}:resource1:edit-comment:earlier`);

      await act(async () => {
        await result.props?.onCommentVisible?.("earlier");
        await result.props?.onCommentVisible?.("earlier");
      });

      expect(readNotification).toHaveBeenCalledTimes(1);
      expect(readNotification.mock.calls[0]?.[0]).toEqual({ ids: ["notification1"] });
      expect(invalidateQueries).toHaveBeenCalledWith(client, "none");
      expect(result.props?.commentDraftKey).toBe(`${resourceType}:resource1:new-comment`);

      await act(async () => {
        expect(await result.props?.onEditComment("earlier", { edited: true })).toBe(true);
      });

      expect(update.mock.calls[0]?.[0]).toEqual({
        commentId: "earlier",
        parentType: resourceType,
        content: '{"edited":true}',
      });

      expect(invalidateQueries).toHaveBeenCalledWith(client, "active");

      invalidateQueries.mockClear();

      await act(async () => {
        const calls = jest.mocked(useReloadCommentsSignal).mock.calls;
        const latest = calls[calls.length - 1];
        latest?.[0]();
      });

      expect(invalidateQueries).toHaveBeenCalledWith(client, "active");
      expect(client.getQueryState(other)?.isInvalidated).toBe(false);
      expect(client.getQueryState(otherType)?.isInvalidated).toBe(false);
    } finally {
      await act(async () => root.unmount());
      client.clear();
      jest.restoreAllMocks();
    }
  },
);

it("keeps cached comments visible when a background refresh fails", async () => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  const entity = { id: "discussion1", type: "message" as const };
  const key = Api.comments.listQueryKey({ entityId: entity.id, entityType: entity.type });
  const comment = {
    id: "comment1",
    insertedAt: "2026-09-10T10:00:00Z",
    content: "{}",
    author: { id: "me", fullName: "Me" },
  };
  client.setQueryData(key, { comments: [comment] });
  const options = Api.comments.listQueryOptions;
  const error = new Error("Offline");
  jest.spyOn(Api.comments, "listQueryOptions").mockImplementation((input) => ({
    ...options(input),
    queryFn: async () => {
      throw error;
    },
  }));
  const { result, rerender, unmount } = renderHook(
    () =>
      useCommentSection({
        entity,
        mentionSearchScope: { type: "space", id: "space1" },
        invalidateQueries: async () => {},
        canComment: true,
      }),
    {
      initialProps: undefined,
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    },
  );
  try {
    await act(() => client.invalidateQueries({ queryKey: key }));
    await waitFor(() => expect(client.getQueryState(key)?.error).toBe(error));
    rerender(undefined);
    expect(result.current?.items).toHaveLength(1);
    expect(result.current?.items[0]?.type).toBe("comment");
  } finally {
    unmount();
    client.clear();
    jest.restoreAllMocks();
  }
});

it("appends queued document comments without moving them while saving or refreshing", async () => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  const entity = { id: "document1", type: "resource_hub_document" as const };
  const key = Api.comments.listQueryKey({ entityId: entity.id, entityType: entity.type });
  const person = { id: "me", fullName: "Me" } as Person;
  // The browser clock is behind the server, and the saved comments share a timestamp.
  const existing: Comment = {
    __typename: "comment",
    id: "existing",
    insertedAt: "2099-01-01T12:00:00Z",
    content: '"existing"',
    author: person,
  };
  const first = { ...existing, id: "first", content: '"first"' };
  const second = { ...existing, id: "second", content: '"second"' };
  client.setQueryData(key, { comments: [existing] });

  const firstSave = deferred<{ comment: Comment }>();
  const secondSave = deferred<{ comment: Comment }>();
  const refresh = deferred<{ comments: Comment[] }>();
  const create = jest.fn().mockReturnValueOnce(firstSave.promise).mockReturnValueOnce(secondSave.promise);
  jest.spyOn(Api.comments, "createMutationOptions").mockReturnValue({ mutationFn: create });
  const options = Api.comments.listQueryOptions;
  jest.spyOn(Api.comments, "listQueryOptions").mockImplementation((input) => ({
    ...options(input),
    queryFn: () => refresh.promise,
  }));

  const { result, unmount } = renderHook(
    () =>
      useCommentSection({
        entity,
        mentionSearchScope: { type: "resource_hub", id: "hub1" },
        invalidateQueries: async (queryClient, refetchType) => {
          await queryClient.invalidateQueries({ queryKey: key, refetchType });
        },
        canComment: true,
      }),
    {
      initialProps: undefined,
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    },
  );
  const contents = () => result.current?.items.flatMap((item) => (item.type === "comment" ? [item.value.content] : []));
  let firstSubmit: Promise<boolean | void> | undefined;
  let secondSubmit: Promise<boolean | void> | undefined;

  try {
    await act(async () => {
      firstSubmit = Promise.resolve(result.current?.onAddComment("first"));
      secondSubmit = Promise.resolve(result.current?.onAddComment("second"));
    });
    expect(contents()).toEqual(['"existing"', '"first"', '"second"']);

    await act(async () => {
      firstSave.resolve({ comment: first });
      await firstSubmit;
    });
    expect(contents()).toEqual(['"existing"', '"first"', '"second"']);

    await act(async () => secondSave.resolve({ comment: second }));
    await waitFor(() =>
      expect(result.current?.items.map((item) => item.value.id)).toEqual(["existing", "first", "second"]),
    );
    expect(contents()).toEqual(['"existing"', '"first"', '"second"']);

    await act(async () => {
      refresh.resolve({ comments: [existing, first, second] });
      await secondSubmit;
    });
    expect(contents()).toEqual(['"existing"', '"first"', '"second"']);
  } finally {
    unmount();
    client.clear();
    jest.restoreAllMocks();
  }
});

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((done) => {
    resolve = done;
  });

  return { promise, resolve };
}
