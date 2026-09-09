/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { loader, useLoadedData } from "./loader";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({
  useLoadedData: () => ({
    workMapInput: { spaceId: "space-1" },
    spaceInput: { id: "space-1", includeAccessLevels: true, includePermissions: true },
    templatesInput: { archiveStatus: "active" },
  }),
}));

function deferred() {
  let resolve: (value: unknown) => void = () => {};
  let reject: (error: Error) => void = () => {};
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("SpaceWorkMapPage loading", () => {
  let root: Root;
  let loaded: ReturnType<typeof useLoadedData>;
  const space = { id: "space-1", name: "Engineering" };
  const spaceInput = { id: space.id, includeAccessLevels: true, includePermissions: true };

  beforeEach(() => {
    jest.useFakeTimers();
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
    root = createRoot(document.createElement("div"));
    queryClient.clear();
    jest.resetAllMocks();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    queryClient.clear();
    jest.useRealTimers();
  });

  async function mount(workMap = [{ id: "project-1" }]) {
    queryClient.setQueryData(Api.companies.getWorkMapQueryKey({ spaceId: space.id }), { workMap });
    queryClient.setQueryData(Api.spaces.getQueryKey(spaceInput), { space });
    function Harness() {
      loaded = useLoadedData();
      return null;
    }
    await act(async () =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <Harness />
        </QueryClientProvider>,
      ),
    );
  }

  async function advance(milliseconds = 1) {
    await act(async () => {
      await jest.advanceTimersByTimeAsync(milliseconds);
    });
  }

  it.each(["map", "space"])(
    "awaits both map and space, with %s finishing first, without requesting templates",
    async (first) => {
      const mapRequest = deferred();
      const spaceRequest = deferred();
      jest.mocked(axios.get).mockReturnValueOnce(mapRequest.promise).mockReturnValueOnce(spaceRequest.promise);
      let completed = false;
      const pending = loader({ params: { id: space.id } }).then((inputs) => {
        completed = true;
        return inputs;
      });
      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(jest.mocked(axios.get).mock.calls.map(([url]) => url)).toEqual([
        "/api/v2/companies/get_work_map",
        "/api/v2/spaces/get",
      ]);
      if (first === "map") mapRequest.resolve({ data: { work_map: [] } });
      else spaceRequest.resolve({ data: { space } });
      await advance();
      expect(completed).toBe(false);
      mapRequest.resolve({ data: { work_map: [] } });
      spaceRequest.resolve({ data: { space } });
      await expect(pending).resolves.toEqual({
        workMapInput: { spaceId: space.id },
        spaceInput,
        templatesInput: { archiveStatus: "active" },
      });
      expect(axios.get).toHaveBeenCalledTimes(2);
    },
  );

  it.each([{ workMap: [] }, { workMap: [{ id: "project-1" }] }])(
    "keeps the map available while templates load: %j",
    async ({ workMap }) => {
      const request = deferred();
      jest.mocked(axios.get).mockReturnValue(request.promise);
      await mount(workMap);
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(jest.mocked(axios.get).mock.calls[0]?.[0]).toContain("/project_templates/list");
      expect(loaded.data).toMatchObject({ workMap, space });
      expect(loaded.creationData).toMatchObject({ isLoading: true, error: null });
      await act(async () => request.resolve({ data: { templates: [] } }));
      await advance();
      expect(loaded.creationData).toMatchObject({ isLoading: false, error: null });
      expect(loaded.data.templates).toEqual([]);
    },
  );

  it("reports only the third failure and retries only templates", async () => {
    jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
    await mount();
    await advance();
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(loaded.creationData).toMatchObject({ isLoading: true, error: null });
    await advance(1000);
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(loaded.creationData).toMatchObject({ isLoading: true, error: null });
    await advance(2000);
    await advance();
    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(loaded.creationData).toMatchObject({ isLoading: false, error: new Error("Offline") });
    expect(loaded.data.workMap).toHaveLength(1);

    const request = deferred();
    jest.mocked(axios.get).mockReturnValue(request.promise);
    let retry: Promise<void> | undefined;
    await act(async () => {
      retry = loaded.creationData.retry();
    });
    await advance();
    expect(loaded.creationData).toMatchObject({ isLoading: true, error: null });
    await act(async () => {
      request.resolve({ data: { templates: [] } });
      await retry;
    });
    await advance();
    expect(axios.get).toHaveBeenCalledTimes(4);
    expect(loaded.creationData).toMatchObject({ isLoading: false, error: null });
    expect(jest.mocked(axios.get).mock.calls.every(([url]) => url.endsWith("/project_templates/list"))).toBe(true);
  });

  it("recovers a transient failure automatically", async () => {
    jest
      .mocked(axios.get)
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValue({ data: { templates: [] } });
    await mount();
    await advance(1000);
    await advance();
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(loaded.creationData).toMatchObject({ isLoading: false, error: null });
  });

  it("preserves cached templates during a background refresh and its failure", async () => {
    const templates = [{ id: "template-1", name: "Launch", space }];
    queryClient.setQueryData(Api.project_templates.listQueryKey({ archiveStatus: "active" }), { templates });
    const request = deferred();
    jest.mocked(axios.get).mockReturnValue(request.promise);
    await mount();
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(loaded.creationData).toMatchObject({ isLoading: false, error: null });
    expect(loaded.data.templates).toEqual(templates);
    await act(async () => request.reject(new Error("Offline")));
    await advance(1000);
    await advance(2000);
    await advance();
    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(loaded.creationData).toMatchObject({ isLoading: false, error: null });
    expect(loaded.data.templates).toEqual(templates);
  });
});
