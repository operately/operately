/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api, { type Space } from "@/api";
import { queryClient } from "@/api/queryClient";
import { preload, useLoadedData, type ReadyData } from "./loader";
import { Page } from "./page";

jest.mock("axios");
jest.mock("turboui", () => ({
  ContentListState: ({ loading, children }) => (loading ? <div role="status" /> : children),
  WorkMapPage: ({ items, navigation, addingEnabled }) => (
    <div data-test-id="work-map" data-adding-enabled={addingEnabled} data-item-count={items.length}>
      {navigation[0].label}
    </div>
  ),
}));
jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({ t: (key) => key }),
}));
jest.mock("react-router", () => ({ useNavigate: () => jest.fn() }));
jest.mock("@/routes/paths", () => ({ usePaths: () => ({ spacePath: (id) => `/spaces/${id}` }) }));
jest.mock("../../models/spaces", () => ({ useSpaceSearch: () => jest.fn() }));
jest.mock("../../models/workMap", () => ({
  useWorkMapItems: (items) => [items, jest.fn()],
  convertToWorkMapItems: (_paths, items) => items,
}));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("@/components/Pages", () => ({
  useLoadedData: () => ({
    workMapInput: { spaceId: "space-1" },
    spaceInput: { id: "space-1", includeAccessLevels: true, includePermissions: true },
    templatesInput: { archiveStatus: "active" },
    editableSpacesInput: { query: "", accessLevel: "edit_access" },
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

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{ onError: (error: Error) => void }>,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? <div role="alert" /> : this.props.children;
  }
}

describe("SpaceWorkMapPage loading", () => {
  let root: Root;
  let loaded: ReadyData;
  let container: HTMLDivElement;
  const space: Space = {
    __typename: "space",
    id: "space-1",
    name: "Engineering",
    permissions: {
      __typename: "space_permissions",
      canEdit: true,
      canView: true,
      canComment: true,
      hasFullAccess: true,
    },
  };
  const spaceInput = { id: space.id, includeAccessLevels: true, includePermissions: true };

  beforeEach(() => {
    jest.useFakeTimers();
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
    container = document.createElement("div");
    root = createRoot(container);
    queryClient.clear();
    jest.resetAllMocks();
    // These cases exercise template loading; the editable-space lookup is already available.
    const editableSpacesKey = Api.spaces.searchQueryKey({ query: "", accessLevel: "edit_access" });
    queryClient.setQueryDefaults(editableSpacesKey, { staleTime: Infinity });
    queryClient.setQueryData(editableSpacesKey, { spaces: [space] });
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
      const state = useLoadedData();
      if (state.status !== "ready") throw new Error("Expected seeded map to be ready");
      loaded = state;
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

  it.each(["map", "space"])("recovers an evicted required %s query before rendering the map", async (missing) => {
    jest.mocked(axios.get).mockImplementation(async (url) => ({
      data: url.endsWith("/spaces/get") ? { space } : { workMap: [] },
    }));
    await preload({ params: { id: space.id } });
    const key =
      missing === "map" ? Api.companies.getWorkMapQueryKey({ spaceId: space.id }) : Api.spaces.getQueryKey(spaceInput);
    queryClient.removeQueries({ queryKey: key, exact: true });
    const recovery = deferred();
    const templates = deferred();
    jest
      .mocked(axios.get)
      .mockImplementation((url) => (url.endsWith("/project_templates/list") ? templates.promise : recovery.promise));
    await act(async () =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>,
      ),
    );
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    expect(container.querySelector('[data-test-id="work-map"]')).toBeNull();
    await act(async () => recovery.resolve({ data: missing === "map" ? { workMap: [] } : { space } }));
    await advance();
    expect(container.querySelector('[role="status"]')).toBeNull();
    const map = container.querySelector('[data-test-id="work-map"]');
    expect(map?.textContent).toBe(space.name);
    expect(map?.getAttribute("data-item-count")).toBe("0");
    expect(map?.getAttribute("data-adding-enabled")).toBe("false");
    await act(async () => templates.resolve({ data: { templates: [] } }));
    await advance();
    expect(map?.getAttribute("data-adding-enabled")).toBe("true");
  });

  it("propagates the original required recovery failure to the boundary", async () => {
    jest.mocked(axios.get).mockImplementation(async (url) => ({
      data: url.endsWith("/spaces/get") ? { space } : { workMap: [] },
    }));
    await preload({ params: { id: space.id } });
    queryClient.removeQueries({ queryKey: Api.spaces.getQueryKey(spaceInput), exact: true });
    const recovery = deferred();
    jest.mocked(axios.get).mockReturnValue(recovery.promise);
    const onError = jest.fn();
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await act(async () =>
        root.render(
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary onError={onError}>
              <Page />
            </ErrorBoundary>
          </QueryClientProvider>,
        ),
      );
      expect(container.querySelector('[role="status"]')).not.toBeNull();
      const error = new Error("Service unavailable");
      await act(async () => recovery.reject(error));
      await advance();
      expect(onError.mock.calls[0]?.[0]).toBe(error);
      expect(container.querySelector('[role="alert"]')).not.toBeNull();
    } finally {
      log.mockRestore();
    }
  });

  it("treats a successful response without a space as an invariant failure", async () => {
    queryClient.setQueryData(Api.spaces.getQueryKey(spaceInput), { space: null });
    queryClient.setQueryData(Api.companies.getWorkMapQueryKey({ spaceId: space.id }), { workMap: [] });
    jest.mocked(axios.get).mockResolvedValue({ data: { templates: [] } });
    const onError = jest.fn();
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await act(async () =>
        root.render(
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary onError={onError}>
              <Page />
            </ErrorBoundary>
          </QueryClientProvider>,
        ),
      );
      expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
      expect(container.querySelector('[role="alert"]')).not.toBeNull();
      expect(container.querySelector('[role="status"]')).toBeNull();
    } finally {
      log.mockRestore();
    }
  });

  it.each(["map", "space"])(
    "awaits both map and space, with %s finishing first, without requesting templates",
    async (first) => {
      const mapRequest = deferred();
      const spaceRequest = deferred();
      jest.mocked(axios.get).mockReturnValueOnce(mapRequest.promise).mockReturnValueOnce(spaceRequest.promise);
      let completed = false;
      const pending = preload({ params: { id: space.id } }).then((inputs) => {
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
        editableSpacesInput: { query: "", accessLevel: "edit_access" },
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

  it("waits for editable spaces before allowing creation", async () => {
    queryClient.removeQueries({ queryKey: Api.spaces.searchQueryKeyPrefix() });
    const request = deferred();
    jest
      .mocked(axios.get)
      .mockImplementation((url) =>
        url.endsWith("/spaces/search") ? request.promise : Promise.resolve({ data: { templates: [] } }),
      );
    await mount();
    await advance();
    expect(loaded.creationData.isLoading).toBe(true);
    expect(loaded.data.editableSpaces).toEqual([]);
    await act(async () => request.resolve({ data: { spaces: [space] } }));
    await advance();
    expect(loaded.creationData).toMatchObject({ isLoading: false, error: null });
    expect(loaded.data.editableSpaces).toEqual([space]);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/spaces/search"),
      expect.objectContaining({ params: expect.objectContaining({ access_level: "edit_access" }) }),
    );
  });

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
