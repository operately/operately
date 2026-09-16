/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api, { type ProjectTemplateComment } from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { useTemplateCommentMutations } from "./projectTemplateCommentLifecycle";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("react-router", () => ({}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "person1", fullName: "Author" }) }));

const scope = { templateId: "template1", parentType: "document" as const, parentId: "document1" };
const comment: ProjectTemplateComment = {
  __typename: "project_template_comment",
  id: "comment1",
  parentType: "document",
  parentId: "document1",
  content: "original",
  position: 0,
  insertedAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
});

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const affected = [
    Api.project_templates.listCommentsQueryKey(scope),
    Api.project_templates.listCommentsQueryKey({
      ...scope,
      templateId: "renamed-template1",
      parentId: "renamed-document1",
    }),
  ];
  const unrelated = [
    Api.project_templates.listCommentsQueryKey({ ...scope, templateId: "template2" }),
    Api.project_templates.listCommentsQueryKey({ ...scope, parentId: "document2" }),
    Api.project_templates.listCommentsQueryKey({ ...scope, parentType: "discussion" }),
    Api.project_templates.getQueryKey({ id: "template2" }),
  ];
  [...affected, ...unrelated].forEach((key) => client.setQueryData(key, { comments: [comment] }));

  const hook = renderHook(useTemplateCommentMutations, {
    initialProps: scope,
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
  const comments = () =>
    client.getQueryData<{ comments: ProjectTemplateComment[] }>(Api.project_templates.listCommentsQueryKey(scope))
      ?.comments;

  return { client, affected, unrelated, comments, ...hook };
}

it("appends optimistic comments and updates only matching caches after success", async () => {
  const { client, affected, unrelated, result, comments, unmount } = setup();
  let finish = (_value: unknown) => {};
  jest.mocked(axios.post).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  let saving: Promise<unknown>;

  act(() => {
    saving = result.current.create.mutateAsync({ ...scope, content: "new" });
  });
  await waitFor(() => expect(comments()?.map((item) => item.content)).toEqual(["original", "new"]));
  expect(comments()?.[1]?.id).toMatch(/^temp-/);

  await act(async () => {
    finish({ data: { comment: { ...comment, id: "comment2", content: "new" } } });
    await saving;
  });

  expect(comments()?.map((item) => item.id)).toEqual(["comment1", "comment2"]);
  affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  unmount();
  client.clear();
});

it("removes only the failed optimistic comment and leaves caches fresh", async () => {
  const { client, affected, result, comments, unmount } = setup();
  jest.mocked(axios.post).mockRejectedValue(new Error("Offline"));

  await act(async () => {
    await expect(result.current.create.mutateAsync({ ...scope, content: "new" })).rejects.toThrow("Offline");
  });

  expect(comments()).toEqual([comment]);
  affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  unmount();
  client.clear();
});

it("updates and deletes comments in every matching cached list", async () => {
  const { client, affected, unrelated, result, comments, unmount } = setup();
  jest.mocked(axios.post).mockResolvedValue({ data: { comment: { ...comment, content: "edited" } } });

  await act(() =>
    result.current.update.mutateAsync({ templateId: scope.templateId, commentId: comment.id, content: "edited" }),
  );
  expect(comments()?.[0]?.content).toBe("edited");

  jest.mocked(axios.post).mockResolvedValue({ data: { success: true } });
  await act(() => result.current.remove.mutateAsync({ templateId: scope.templateId, commentId: comment.id }));

  affected.forEach((key) => expect(client.getQueryData(key)).toEqual({ comments: [] }));
  unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  unmount();
  client.clear();
});

it("awaits invalidation and keeps the original resource when navigation occurs during a save", async () => {
  const { client, affected, unrelated, result, rerender, unmount } = setup();
  let finish = (_value: unknown) => {};
  jest.mocked(axios.post).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const invalidate = client.invalidateQueries.bind(client);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  jest.spyOn(client, "invalidateQueries").mockImplementation(async (filters) => {
    await invalidate(filters);
    await gate;
  });
  let completed = false;
  let saving: Promise<unknown>;

  act(() => {
    saving = result.current.create.mutateAsync({ ...scope, content: "new" }).then(() => {
      completed = true;
    });
  });
  await waitFor(() => expect(axios.post).toHaveBeenCalled());
  rerender({ ...scope, parentId: "document2" });

  await act(async () => {
    finish({ data: { comment: { ...comment, id: "comment2" } } });
  });
  await waitFor(() => expect(client.invalidateQueries).toHaveBeenCalled());
  expect(completed).toBe(false);

  await act(async () => {
    release();
    await saving;
  });
  affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  unmount();
  client.clear();
});

it.each(["update", "remove"] as const)("does not invalidate when %s fails", async (action) => {
  const { client, affected, result, comments, unmount } = setup();
  jest.mocked(axios.post).mockRejectedValue(new Error("Offline"));

  await act(async () => {
    const input = { templateId: scope.templateId, commentId: comment.id, content: "edited" };
    const saving =
      action === "update" ? result.current.update.mutateAsync(input) : result.current.remove.mutateAsync(input);
    await expect(saving).rejects.toThrow("Offline");
  });

  expect(comments()).toEqual([comment]);
  affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  unmount();
  client.clear();
});

it("does not invalidate or remove a comment when the API reports unsuccessful deletion", async () => {
  const { client, affected, result, comments, unmount } = setup();
  jest.mocked(axios.post).mockResolvedValue({ data: { success: false } });

  await act(() => result.current.remove.mutateAsync({ templateId: scope.templateId, commentId: comment.id }));

  expect(comments()).toEqual([comment]);
  affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  unmount();
  client.clear();
});

it("preserves submission order and defers refetching until all pending writes settle", async () => {
  const { client, result, comments, unmount } = setup();
  const requests: { resolve: (value: unknown) => void; reject: (error: Error) => void }[] = [];
  jest.mocked(axios.post).mockImplementation(
    () =>
      new Promise((resolve, reject) => {
        requests.push({ resolve, reject });
      }),
  );
  const refetch = jest.spyOn(client, "refetchQueries");
  let first: Promise<unknown>;
  let second: Promise<unknown>;

  act(() => {
    first = result.current.create.mutateAsync({ ...scope, content: "first" });
    second = result.current.create.mutateAsync({ ...scope, content: "second" }).catch(() => undefined);
  });
  await waitFor(() => expect(comments()?.map((item) => item.content)).toEqual(["original", "first", "second"]));
  expect(requests).toHaveLength(1);

  await act(async () => {
    requests[0]?.resolve({ data: { comment: { ...comment, id: "first", content: "first" } } });
    await first;
  });
  await waitFor(() => expect(requests).toHaveLength(2));
  expect(refetch).not.toHaveBeenCalled();
  expect(comments()?.map((item) => item.content)).toEqual(["original", "first", "second"]);

  await act(async () => {
    requests[1]?.reject(new Error("Offline"));
    await second;
  });
  expect(comments()?.map((item) => item.content)).toEqual(["original", "first"]);
  expect(refetch).toHaveBeenCalledTimes(1);
  unmount();
  client.clear();
});

it("does not roll back a successful save when refetching fails", async () => {
  const { client, result, comments, unmount } = setup();
  jest.mocked(axios.post).mockResolvedValue({ data: { comment: { ...comment, content: "edited" } } });
  jest.spyOn(client, "refetchQueries").mockRejectedValue(new Error("Offline"));
  const log = jest.spyOn(console, "error").mockImplementation(() => {});

  try {
    await act(async () => {
      await expect(
        result.current.update.mutateAsync({ templateId: scope.templateId, commentId: comment.id, content: "edited" }),
      ).resolves.toBeDefined();
    });
    expect(comments()?.[0]?.content).toBe("edited");
  } finally {
    log.mockRestore();
    unmount();
    client.clear();
  }
});
