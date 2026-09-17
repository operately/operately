/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api, { type ResourceHubDocument } from "@/api";
import { renderHook, waitFor } from "@/__tests__/renderHook";
import {
  invalidateResourceHubQueries,
  useMoveResource,
  useRenameFolder,
  useRestoreDocumentVersion,
} from "./resourceHubLifecycle";

jest.mock("turboui", () => ({}));
beforeAll(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
});

it.each(["success", "failure", "unsuccessful response"])(
  "invalidates resource lists only after mutation success: %s",
  async (outcome) => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const client = new QueryClient();
    const keys = [
      Api.resource_hubs.getQueryKey({ id: "hub-1" }),
      Api.resource_hubs.listNodesQueryKey({ resourceHubId: "hub-1" }),
      Api.resource_hubs.listDraftsQueryKey({ resourceHubId: "hub-1" }),
      Api.resource_hubs.getFolderQueryKey({ id: "folder-1" }),
      Api.resource_hubs.listNodesQueryKey({ folderId: "folder-1", includeChildrenCount: true }),
      Api.resource_hubs.getQueryKey({ id: "renamed-1", includePermissions: true }),
      Api.spaces.listToolsQueryKey({ spaceId: "old-space1" }),
    ];
    const unrelated = [
      Api.projects.getQueryKey({ id: "project-1" }),
      Api.resource_hubs.getQueryKey({ id: "hub-2" }),
      Api.resource_hubs.listNodesQueryKey({ resourceHubId: "hub-2" }),
      Api.resource_hubs.listDraftsQueryKey({ resourceHubId: "hub-2" }),
      Api.resource_hubs.getFolderQueryKey({ id: "folder-2" }),
      Api.documents.getQueryKey({ id: "document-1" }),
      Api.documents.listVersionsQueryKey({ documentId: "document-1" }),
      Api.files.getQueryKey({ id: "file-1" }),
      Api.links.getQueryKey({ id: "link-1" }),
    ];
    [...keys, ...unrelated].forEach((key) => client.setQueryData(key, {}));
    const mutationFn = jest.fn(async () => {
      if (outcome === "failure") throw new Error("Failed");
      return { success: outcome === "success" };
    });
    const optionsSpy = jest.spyOn(Api.resource_hubs, "renameFolderMutationOptions").mockReturnValue({ mutationFn });
    let mutate!: () => Promise<{ success: boolean }>;
    function Harness() {
      const mutation = useRenameFolder({ spaceId: "space1", resourceHubId: "hub-1" });
      mutate = () => mutation.mutateAsync({ folderId: "folder-1", newName: "Renamed" });
      return null;
    }
    const root = createRoot(document.createElement("div"));
    try {
      await act(async () =>
        root.render(
          <QueryClientProvider client={client}>
            <Harness />
          </QueryClientProvider>,
        ),
      );
      await act(async () => {
        if (outcome === "failure") await expect(mutate()).rejects.toThrow("Failed");
        else await mutate();
      });
      expect(mutationFn).toHaveBeenCalledWith({ folderId: "folder-1", newName: "Renamed" }, expect.anything());
      keys.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(outcome === "success"));
      unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
    } finally {
      await act(async () => root.unmount());
      client.clear();
      optionsSpy.mockRestore();
    }
  },
);

jest.mock("react-router", () => ({}));

it("invalidates cached version history after restoring a document", async () => {
  const client = new QueryClient();
  const key = Api.documents.listVersionsQueryKey({ documentId: "document-1" });
  client.setQueryData(key, { versions: [] });
  const mutationFn = jest.fn(async () => ({ document: { id: "document-1" } as ResourceHubDocument }));
  const optionsSpy = jest.spyOn(Api.documents, "restoreVersionMutationOptions").mockReturnValue({ mutationFn });
  let restore: () => Promise<unknown> = async () => {};

  function Harness() {
    const mutation = useRestoreDocumentVersion();
    restore = () => mutation.mutateAsync({ documentId: "document-1", versionNumber: 1, expectedCurrentVersion: 2 });
    return null;
  }

  const root = createRoot(document.createElement("div"));

  try {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Harness />
        </QueryClientProvider>,
      ),
    );
    await act(async () => {
      await restore();
    });

    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  } finally {
    await act(async () => root.unmount());
    client.clear();
    optionsSpy.mockRestore();
  }
});

it("refreshes documents without guessing a space from cached relationships", async () => {
  const client = new QueryClient();
  const summaryKey = Api.spaces.listToolsQueryKey({ spaceId: "space1" });
  const documentKey = Api.documents.getQueryKey({ id: "document-1" });
  client.setQueryData(summaryKey, { tools: { resourceHubs: [{ id: "hub1" }] } });
  client.setQueryData(documentKey, { document: { id: "document-1", resourceHubId: "hub1" } });
  const optionsSpy = jest.spyOn(Api.documents, "restoreVersionMutationOptions").mockReturnValue({
    mutationFn: async () => ({ document: { id: "document-1" } as ResourceHubDocument }),
  });
  const { result, unmount } = renderHook(() => useRestoreDocumentVersion(), {
    initialProps: undefined,
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });

  try {
    await act(async () => {
      await result.current.mutateAsync({ documentId: "document-1", versionNumber: 1, expectedCurrentVersion: 2 });
    });

    expect(client.getQueryState(documentKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(summaryKey)?.isInvalidated).toBe(false);
  } finally {
    unmount();
    client.clear();
    optionsSpy.mockRestore();
  }
});

it("keeps the originating space after navigation and awaits its invalidation", async () => {
  const client = new QueryClient();
  let finishMutation = () => {};
  const optionsSpy = jest.spyOn(Api.resource_hubs, "renameFolderMutationOptions").mockReturnValue({
    mutationFn: () =>
      new Promise<{ success: boolean }>((resolve) => {
        finishMutation = () => resolve({ success: true });
      }),
  });
  let finishRefresh = () => {};
  const refreshPending = new Promise<void>((resolve) => {
    finishRefresh = resolve;
  });
  const invalidate = jest.spyOn(client, "invalidateQueries").mockReturnValue(refreshPending);
  const { result, rerender, unmount } = renderHook(({ spaceId }) => useRenameFolder({ spaceId }), {
    initialProps: { spaceId: "space1" },
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
  let pending: Promise<unknown> = Promise.resolve();
  let completed = false;

  try {
    act(() => {
      pending = result.current.mutateAsync({ folderId: "folder1", newName: "Renamed" }).then(() => {
        completed = true;
      });
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));
    rerender({ spaceId: "space2" });
    finishMutation();
    await waitFor(() => expect(invalidate).toHaveBeenCalled());
    expect(completed).toBe(false);

    const summaryCall = invalidate.mock.calls.find(
      ([filters]) => JSON.stringify(filters?.queryKey) === JSON.stringify(Api.spaces.listToolsQueryKeyPrefix()),
    );
    const predicate = summaryCall?.[0]?.predicate;
    const source = client
      .getQueryCache()
      .build(client, { queryKey: Api.spaces.listToolsQueryKey({ spaceId: "space1" }) });
    const other = client
      .getQueryCache()
      .build(client, { queryKey: Api.spaces.listToolsQueryKey({ spaceId: "space2" }) });
    expect(predicate?.(source)).toBe(true);
    expect(predicate?.(other)).toBe(false);

    await act(async () => {
      finishRefresh();
      await pending;
    });
    expect(completed).toBe(true);
  } finally {
    unmount();
    client.clear();
    optionsSpy.mockRestore();
  }
});

it("does not fail a successful mutation when refreshing the cache fails", async () => {
  const client = new QueryClient();
  const optionsSpy = jest.spyOn(Api.resource_hubs, "renameFolderMutationOptions").mockReturnValue({
    mutationFn: async () => ({ success: true }),
  });
  jest.spyOn(client, "invalidateQueries").mockRejectedValue(new Error("Offline"));
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  const { result, unmount } = renderHook(() => useRenameFolder({ spaceId: "space1", resourceHubId: "hub-1" }), {
    initialProps: undefined,
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });

  try {
    await act(async () => {
      await expect(result.current.mutateAsync({ folderId: "folder1", newName: "Renamed" })).resolves.toEqual({
        success: true,
      });
    });
    expect(log).toHaveBeenCalled();
  } finally {
    unmount();
    client.clear();
    optionsSpy.mockRestore();
    log.mockRestore();
  }
});

it("invalidates document variants and known parents while preserving other resources", async () => {
  const client = new QueryClient();
  const affected = [
    Api.documents.getQueryKey({ id: "doc1" }),
    Api.documents.getQueryKey({ id: "renamed-doc1", includePermissions: true }),
    Api.documents.listVersionsQueryKey({ documentId: "renamed-doc1" }),
    Api.resource_hubs.getQueryKey({ id: "hub1" }),
    Api.resource_hubs.listNodesQueryKey({ resourceHubId: "hub1" }),
    Api.resource_hubs.listNodesQueryKey({ folderId: "folder1" }),
    Api.resource_hubs.getFolderQueryKey({ id: "folder1" }),
    Api.resource_hubs.listDraftsQueryKey({ resourceHubId: "hub1" }),
  ];
  const unrelated = [
    Api.documents.getQueryKey({ id: "doc2" }),
    Api.documents.listVersionsQueryKey({ documentId: "doc2" }),
    Api.files.getQueryKey({ id: "doc1" }),
    Api.links.getQueryKey({ id: "doc1" }),
    Api.resource_hubs.getQueryKey({ id: "hub2" }),
    Api.resource_hubs.listNodesQueryKey({ resourceHubId: "hub2" }),
    Api.resource_hubs.listDraftsQueryKey({ resourceHubId: "hub2" }),
    Api.resource_hubs.getFolderQueryKey({ id: "folder2" }),
  ];
  [...affected, ...unrelated].forEach((key) => client.setQueryData(key, {}));

  await invalidateResourceHubQueries(
    client,
    { documentId: "doc1" },
    { resourceHubId: "hub1", parentFolderId: "folder1" },
  );

  affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  client.clear();
});

it("refreshes the moved resource and both known folders", async () => {
  const client = new QueryClient();
  const affected = [
    Api.documents.getQueryKey({ id: "doc1" }),
    Api.resource_hubs.getFolderQueryKey({ id: "source" }),
    Api.resource_hubs.listNodesQueryKey({ folderId: "source" }),
    Api.resource_hubs.getFolderQueryKey({ id: "destination" }),
    Api.resource_hubs.listNodesQueryKey({ folderId: "destination" }),
  ];
  const unrelated = Api.resource_hubs.getFolderQueryKey({ id: "other" });
  [...affected, unrelated].forEach((key) => client.setQueryData(key, {}));
  const optionsSpy = jest.spyOn(Api.resource_hubs, "updateParentFolderMutationOptions").mockReturnValue({
    mutationFn: async () => ({ success: true }),
  });
  const { result, unmount } = renderHook(() => useMoveResource({ parentFolderId: "source" }), {
    initialProps: undefined,
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });

  try {
    await act(async () => {
      await result.current.mutateAsync({ resourceType: "document", resourceId: "doc1", newFolderId: "destination" });
    });
    affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
    expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
  } finally {
    unmount();
    client.clear();
    optionsSpy.mockRestore();
  }
});

it("marks a deleted link stale without refetching it while refreshing its parent list", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const detailKey = Api.links.getQueryKey({ id: "link1", includePermissions: true });
  const nodesKey = Api.resource_hubs.listNodesQueryKey({ resourceHubId: "hub1" });
  client.setQueryData(detailKey, {});
  client.setQueryData(nodesKey, {});
  const invalidate = jest.spyOn(client, "invalidateQueries");

  await invalidateResourceHubQueries(client, { linkId: "link1", deleted: true }, { resourceHubId: "hub1" });

  expect(client.getQueryState(detailKey)?.isInvalidated).toBe(true);
  expect(invalidate).toHaveBeenCalledWith(
    expect.objectContaining({ queryKey: Api.links.getQueryKeyPrefix(), refetchType: "none" }),
  );
  expect(invalidate).toHaveBeenCalledWith(
    expect.objectContaining({ queryKey: Api.resource_hubs.listNodesQueryKeyPrefix(), refetchType: "active" }),
  );
  client.clear();
});
