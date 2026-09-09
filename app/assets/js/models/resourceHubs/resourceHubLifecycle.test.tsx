/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api from "@/api";
import { useRenameFolder } from "./resourceHubLifecycle";

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
      Api.resource_hubs.getFolderQueryKey({ id: "folder-1" }),
      Api.documents.getQueryKey({ id: "document-1" }),
      Api.files.getQueryKey({ id: "file-1" }),
      Api.links.getQueryKey({ id: "link-1" }),
    ];
    const unrelated = Api.projects.getQueryKey({ id: "project-1" });
    [...keys, unrelated].forEach((key) => client.setQueryData(key, {}));
    const mutationFn = jest.fn(async () => {
      if (outcome === "failure") throw new Error("Failed");
      return { success: outcome === "success" };
    });
    const optionsSpy = jest.spyOn(Api.resource_hubs, "renameFolderMutationOptions").mockReturnValue({ mutationFn });
    let mutate!: () => Promise<{ success: boolean }>;
    function Harness() {
      const mutation = useRenameFolder();
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
      expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
    } finally {
      await act(async () => root.unmount());
      client.clear();
      optionsSpy.mockRestore();
    }
  },
);
