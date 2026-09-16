/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { useCreateProjectTemplateFromProject } from "./projectTemplateLifecycle";
jest.mock("turboui", () => ({}));
import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import {
  invalidateProjectTemplateListQueries,
  useArchiveProjectTemplate,
  useRestoreProjectTemplate,
  useDeleteProjectTemplate,
} from "./projectTemplateLifecycle";
import { renderHook } from "@/__tests__/renderHook";

jest.mock("react-router", () => ({}));

describe("project template lifecycle queries", () => {
  beforeAll(() => {
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
  });

  it("invalidates project template lists without invalidating template details", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const companyListKey = Api.project_templates.listQueryKey({ archiveStatus: "active" });
    const spaceListKey = Api.project_templates.listQueryKey({ spaceId: "space-1", archiveStatus: "all" });
    const templateKey = Api.project_templates.getQueryKey({ id: "template-1" });

    [companyListKey, spaceListKey, templateKey].forEach((queryKey) => queryClient.setQueryData(queryKey, {}));

    await invalidateProjectTemplateListQueries(queryClient);

    expect(queryClient.getQueryState(companyListKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(spaceListKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(templateKey)?.isInvalidated).toBe(false);
  });
});

describe("save project as template mutation", () => {
  let root: Root;
  let client: QueryClient;
  let mutation: ReturnType<typeof useCreateProjectTemplateFromProject>;
  let request: jest.Mock;

  beforeEach(async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    client = new QueryClient();
    root = createRoot(document.createElement("div"));
    request = jest.fn();
    jest.spyOn(Api.project_templates, "createFromProjectMutationOptions").mockReturnValue({ mutationFn: request });
    function Harness() {
      mutation = useCreateProjectTemplateFromProject();
      return null;
    }
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Harness />
        </QueryClientProvider>,
      ),
    );
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
    jest.restoreAllMocks();
  });

  it.each([
    { name: "creation", result: { template: { id: "template-1" }, scheduleIssues: [] }, invalidates: true },
    {
      name: "schedule issues",
      result: { template: null, scheduleIssues: [{ reason: "missing_start_date" }] },
      invalidates: false,
    },
    { name: "missing template", result: { template: null, scheduleIssues: [] }, invalidates: false },
  ])("$name invalidates lists only when a template is created", async ({ result, invalidates }) => {
    const lists = [Api.project_templates.listQueryKey({}), Api.project_templates.listQueryKey({ spaceId: "space-1" })];
    const detail = Api.project_templates.getQueryKey({ id: "template-1" });
    [...lists, detail].forEach((key) => client.setQueryData(key, {}));
    request.mockResolvedValue(result);
    await act(async () => {
      expect(await mutation.mutateAsync({ projectId: "project-1", name: "Template" })).toEqual(result);
    });
    lists.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(invalidates));
    expect(client.getQueryState(detail)?.isInvalidated).toBe(false);
  });

  it("preserves request failures without invalidating cached lists", async () => {
    const key = Api.project_templates.listQueryKey({});
    client.setQueryData(key, {});
    request.mockRejectedValue(new Error("Save failed"));
    await act(async () => {
      await expect(mutation.mutateAsync({ projectId: "project-1", name: "Template" })).rejects.toThrow("Save failed");
    });
    expect(client.getQueryState(key)?.isInvalidated).toBe(false);
  });

  it("keeps creation successful when refreshing template lists fails", async () => {
    const result = { template: { id: "template-1" }, scheduleIssues: [] };
    request.mockResolvedValue(result);
    jest.spyOn(client, "invalidateQueries").mockRejectedValue(new Error("Refresh failed"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      expect(await mutation.mutateAsync({ projectId: "project-1", name: "Template" })).toEqual(result);
    });
  });
});

describe("library actions refresh cached editors", () => {
  it.each([
    ["archive", useArchiveProjectTemplate, "archiveMutationOptions"],
    ["restore", useRestoreProjectTemplate, "restoreMutationOptions"],
    ["delete", useDeleteProjectTemplate, "deleteMutationOptions"],
  ] as const)("%s invalidates matching editors without refetching them", async (_name, useAction, endpoint) => {
    const client = new QueryClient();
    const details = ["template1", "renamed-template1"].map((id) => Api.project_templates.getQueryKey({ id }));
    const unrelated = Api.project_templates.getQueryKey({ id: "template2" });
    const list = Api.project_templates.listQueryKey({});
    [...details, unrelated, list].forEach((key) => client.setQueryData(key, {}));

    const request = jest.fn().mockResolvedValue({ success: true });
    jest.spyOn(Api.project_templates, endpoint).mockReturnValue({ mutationFn: request });
    const invalidate = jest.spyOn(client, "invalidateQueries");
    const { result, unmount } = renderHook(useAction, {
      initialProps: undefined,
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    });

    try {
      await act(async () => {
        await result.current.mutateAsync({ id: "old-template1" });
      });

      details.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
      expect(client.getQueryState(list)?.isInvalidated).toBe(true);
      expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
      expect(invalidate).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: Api.project_templates.getQueryKeyPrefix(),
          refetchType: "none",
        }),
      );
    } finally {
      unmount();
      client.clear();
      jest.restoreAllMocks();
    }
  });

  it("waits for invalidation before completing an archive", async () => {
    const client = new QueryClient();
    jest.spyOn(Api.project_templates, "archiveMutationOptions").mockReturnValue({
      mutationFn: jest.fn().mockResolvedValue({ success: true }),
    });
    let finishRefresh = () => {};
    const refreshing = new Promise<void>((resolve) => {
      finishRefresh = resolve;
    });
    jest.spyOn(client, "invalidateQueries").mockReturnValue(refreshing);
    const { result, unmount } = renderHook(useArchiveProjectTemplate, {
      initialProps: undefined,
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    });
    let completed = false;

    try {
      let saving: Promise<unknown>;
      await act(async () => {
        saving = result.current.mutateAsync({ id: "template1" }).then(() => {
          completed = true;
        });
      });
      expect(client.invalidateQueries).toHaveBeenCalled();
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
      jest.restoreAllMocks();
    }
  });
});
