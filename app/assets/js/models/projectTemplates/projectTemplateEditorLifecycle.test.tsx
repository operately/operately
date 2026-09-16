/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider, QueryObserver } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import {
  useUpdateTemplate,
  useUpdateTemplateTask,
  useDeleteTemplateTask,
  useDeleteTemplate,
  useCreateTemplateDiscussion,
  useUpdateTemplateDiscussion,
  useCreateTemplateDocument,
  useUpdateTemplateDocument,
  useCreateTemplateLink,
  useUpdateTemplateLink,
  useUpdateTemplateFile,
  useDeleteTemplateResource,
} from "./projectTemplateEditorLifecycle";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("react-router", () => ({}));

beforeEach(() => {
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
  jest.mocked(axios.post).mockResolvedValue({ data: { success: true } });
});

function setup() {
  const client = new QueryClient();
  const affected = [
    Api.project_templates.getQueryKey({ id: "template1" }),
    Api.project_templates.getQueryKey({ id: "renamed-template1" }),
    Api.project_templates.getDiscussionQueryKey({ templateId: "renamed-template1", discussionId: "discussion1" }),
    Api.project_templates.listQueryKey({ spaceId: "space1" }),
    Api.spaces.listToolsQueryKey({ spaceId: "renamed-space1" }),
  ];
  const unrelated = [
    Api.project_templates.getQueryKey({ id: "template2" }),
    Api.project_templates.getDiscussionQueryKey({ templateId: "template2", discussionId: "discussion2" }),
    Api.spaces.listToolsQueryKey({ spaceId: "space2" }),
  ];
  [...affected, ...unrelated].forEach((key) => client.setQueryData(key, {}));

  const hook = renderHook(
    (scope: { templateId: string; spaceId: string }) => ({
      update: useUpdateTemplate(scope).mutateAsync,
      updateTask: useUpdateTemplateTask(scope).mutateAsync,
      deleteTask: useDeleteTemplateTask(scope).mutateAsync,
      delete: useDeleteTemplate(scope).mutateAsync,
    }),
    {
      initialProps: { templateId: "template1", spaceId: "space1" },
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    },
  );

  return {
    client,
    affected,
    unrelated,
    ...hook,
    cleanup: () => {
      hook.unmount();
      client.clear();
    },
  };
}

it("invalidates only matching template details and summaries, plus template lists", async () => {
  const { client, affected, unrelated, result, cleanup } = setup();

  try {
    await act(() => result.current.updateTask({ templateId: "template1", taskId: "task1", name: "Updated" }));

    affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
    unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  } finally {
    cleanup();
  }
});

it.each(["failure", "unsuccessful"])("does not invalidate after %s", async (outcome) => {
  const { client, affected, result, cleanup } = setup();
  if (outcome === "failure") jest.mocked(axios.post).mockRejectedValueOnce(new Error("Offline"));
  else jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: false } });

  try {
    await act(async () => {
      await expect(result.current.deleteTask({ templateId: "template1", taskId: "task1" })).rejects.toThrow();
    });

    affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  } finally {
    cleanup();
  }
});

it("captures the originating template and waits for invalidation after navigation", async () => {
  const { client, affected, unrelated, result, rerender, cleanup } = setup();
  let finishRequest = (_value: unknown) => {};
  jest.mocked(axios.post).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishRequest = resolve;
      }),
  );

  const invalidate = client.invalidateQueries.bind(client);
  jest.spyOn(client, "invalidateQueries");

  // One shared gate covers every invalidation promise.
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  jest.mocked(client.invalidateQueries).mockImplementation(async (filters) => {
    await invalidate(filters);
    await gate;
  });

  let completed = false;

  let saving: Promise<unknown>;
  act(() => {
    saving = result.current.update({ id: "template1", name: "Updated" }).then(() => {
      completed = true;
    });
  });

  await waitFor(() => expect(axios.post).toHaveBeenCalled());

  rerender({ templateId: "template2", spaceId: "space2" });
  await act(async () => {
    finishRequest({ data: { success: true } });
  });

  await waitFor(() => expect(client.invalidateQueries).toHaveBeenCalled());
  expect(completed).toBe(false);

  await act(async () => {
    release();
    await saving;
  });

  affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));

  cleanup();
});

it("marks deleted template details stale without refetching the mounted page", async () => {
  const { client, result, cleanup } = setup();

  const fetch = jest.fn().mockResolvedValue({});
  const observer = new QueryObserver(client, {
    queryKey: Api.project_templates.getQueryKey({ id: "template1" }),
    queryFn: fetch,
    staleTime: Infinity,
  });
  const unsubscribe = observer.subscribe(() => {});

  try {
    await act(() => result.current.delete({ id: "template1" }));

    expect(fetch).not.toHaveBeenCalled();
  } finally {
    unsubscribe();
    cleanup();
  }
});

it("does not roll back a successful write when refreshing fails", async () => {
  const { client, result, cleanup } = setup();
  jest.spyOn(client, "invalidateQueries").mockRejectedValue(new Error("Offline"));
  const log = jest.spyOn(console, "error").mockImplementation(() => {});

  try {
    await act(async () => {
      await expect(result.current.update({ id: "template1", name: "Updated" })).resolves.toEqual({ success: true });
    });
  } finally {
    log.mockRestore();
    cleanup();
  }
});

it("refreshes the destination editor when a save finishes after the originating page unmounts", async () => {
  const { client, result, unmount, cleanup } = setup();
  let finishRequest = (_value: unknown) => {};
  jest.mocked(axios.post).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishRequest = resolve;
      }),
  );

  let saving: Promise<unknown>;
  act(() => {
    saving = result.current.updateTask({ templateId: "template1", taskId: "task1", name: "Updated" });
  });

  await waitFor(() => expect(axios.post).toHaveBeenCalled());
  unmount();

  const fetch = jest.fn().mockResolvedValue({ template: { id: "template1", name: "Updated" } });
  const observer = new QueryObserver(client, {
    queryKey: Api.project_templates.getQueryKey({ id: "template1" }),
    queryFn: fetch,
    staleTime: Infinity,
  });
  const unsubscribe = observer.subscribe(() => {});

  try {
    await act(async () => {
      finishRequest({ data: { success: true } });
      await saving;
    });

    expect(fetch).toHaveBeenCalledTimes(1);
  } finally {
    unsubscribe();
    cleanup();
  }
});

const resourceMutations = [
  {
    name: "createDiscussion",
    useSave(scope: { templateId: string; spaceId: string }) {
      const mutation = useCreateTemplateDiscussion(scope);
      return () => mutation.mutateAsync({ templateId: scope.templateId, title: "Notes", body: "{}" });
    },
  },
  {
    name: "updateDiscussion",
    useSave(scope: { templateId: string; spaceId: string }) {
      const mutation = useUpdateTemplateDiscussion(scope);
      return () =>
        mutation.mutateAsync({ templateId: scope.templateId, discussionId: "discussion1", title: "Notes", body: "{}" });
    },
  },
  {
    name: "createDocument",
    useSave(scope: { templateId: string; spaceId: string }) {
      const mutation = useCreateTemplateDocument(scope);
      return () => mutation.mutateAsync({ templateId: scope.templateId, name: "Document", content: "{}" });
    },
  },
  {
    name: "updateDocument",
    useSave(scope: { templateId: string; spaceId: string }) {
      const mutation = useUpdateTemplateDocument(scope);
      return () =>
        mutation.mutateAsync({
          templateId: scope.templateId,
          documentId: "document1",
          name: "Document",
          content: "{}",
        });
    },
  },
  {
    name: "createLink",
    useSave(scope: { templateId: string; spaceId: string }) {
      const mutation = useCreateTemplateLink(scope);
      return () =>
        mutation.mutateAsync({ templateId: scope.templateId, name: "Link", url: "https://example.com", type: "other" });
    },
  },
  {
    name: "updateLink",
    useSave(scope: { templateId: string; spaceId: string }) {
      const mutation = useUpdateTemplateLink(scope);
      return () =>
        mutation.mutateAsync({
          templateId: scope.templateId,
          linkId: "link1",
          name: "Link",
          url: "https://example.com",
          type: "other",
        });
    },
  },
  {
    name: "updateFile",
    useSave(scope: { templateId: string; spaceId: string }) {
      const mutation = useUpdateTemplateFile(scope);
      return () => mutation.mutateAsync({ templateId: scope.templateId, fileId: "file1", name: "File" });
    },
  },
  {
    name: "deleteResource",
    useSave(scope: { templateId: string; spaceId: string }) {
      const mutation = useDeleteTemplateResource(scope);
      return () => mutation.mutateAsync({ templateId: scope.templateId, nodeId: "node1" });
    },
  },
];

describe.each(resourceMutations)("$name", ({ useSave }) => {
  function setupResource() {
    const client = new QueryClient();
    const affected = [
      Api.project_templates.getQueryKey({ id: "renamed-template1" }),
      Api.project_templates.listQueryKey({ spaceId: "space1" }),
      Api.spaces.listToolsQueryKey({ spaceId: "space1" }),
    ];
    const unrelated = Api.project_templates.getQueryKey({ id: "template2" });
    [...affected, unrelated].forEach((key) => client.setQueryData(key, {}));

    const hook = renderHook<{ templateId: string; spaceId: string }, () => Promise<unknown>>(useSave, {
      initialProps: { templateId: "template1", spaceId: "space1" },
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    });

    return { client, affected, unrelated, ...hook };
  }

  it("invalidates the originating template and awaits refresh before completing", async () => {
    const { client, affected, unrelated, result, unmount } = setupResource();
    const invalidate = client.invalidateQueries.bind(client);
    let finishRefresh = () => {};
    const gate = new Promise<void>((resolve) => {
      finishRefresh = resolve;
    });
    jest.spyOn(client, "invalidateQueries").mockImplementation(async (filters) => {
      await invalidate(filters);
      await gate;
    });
    let completed = false;
    let saving: Promise<unknown>;

    try {
      act(() => {
        saving = result.current().then(() => {
          completed = true;
        });
      });
      await waitFor(() => expect(client.invalidateQueries).toHaveBeenCalled());

      affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
      expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
      expect(completed).toBe(false);

      await act(async () => {
        finishRefresh();
        await saving;
      });
      expect(completed).toBe(true);
    } finally {
      finishRefresh();
      unmount();
      client.clear();
    }
  });

  it.each(["rejected", "unsuccessful"])("preserves caches when a write is %s", async (outcome) => {
    const { client, affected, result, unmount } = setupResource();
    if (outcome === "rejected") jest.mocked(axios.post).mockRejectedValueOnce(new Error("Offline"));
    else jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: false } });

    try {
      await act(async () => {
        await expect(result.current()).rejects.toThrow();
      });

      affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
    } finally {
      unmount();
      client.clear();
    }
  });
});
