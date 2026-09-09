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
    companyInput: { includeGeneralSpace: true },
    workMapInput: {},
    spacesCountInput: { accessLevel: "edit_access" },
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

describe("CompanyWorkMapPage loading", () => {
  let root: Root;
  let loaded: ReturnType<typeof useLoadedData>;
  const company = { id: "company-1", name: "Company", general_space: { id: "general", name: "General" } };

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

  async function mount() {
    queryClient.setQueryData(Api.companies.getWorkMapQueryKey({}), { workMap: [{ id: "project-1" }] });
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

  async function flush() {
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1);
    });
  }

  async function exhaustRetries() {
    for (const delay of [1000, 2000]) {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(delay);
      });
    }
    await flush();
  }

  it("only requests the work map before completing the loader", async () => {
    const request = deferred();
    jest.mocked(axios.get).mockReturnValue(request.promise);
    let completed = false;
    const pending = loader().then((inputs) => {
      completed = true;
      return inputs;
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(jest.mocked(axios.get).mock.calls[0]?.[0]).toContain("/companies/get_work_map");
    await Promise.resolve();
    expect(completed).toBe(false);
    request.resolve({ data: { work_map: [] } });
    await expect(pending).resolves.toMatchObject({ workMapInput: {}, companyInput: { includeGeneralSpace: true } });
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it("keeps work items available while each supporting request finishes", async () => {
    const requests = [deferred(), deferred(), deferred()];
    requests.forEach((request) => jest.mocked(axios.get).mockReturnValueOnce(request.promise));
    await mount();
    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(loaded.data.workMap).toEqual([{ id: "project-1" }]);
    expect(loaded.creationData.isLoading).toBe(true);

    const responses = [{ company }, { count: 0 }, { templates: [] }];
    for (const [index, request] of requests.entries()) {
      await act(async () => request.resolve({ data: responses[index] }));
      await flush();
      expect(loaded.creationData.isLoading).toBe(index < 2);
    }
    expect(loaded.creationData.error).toBeNull();
    expect(loaded.data.spacesCount).toBe(0);
    expect(loaded.data.templates).toEqual([]);
  });

  it("reports an error only after the third failed attempt and allows manual retry", async () => {
    jest
      .mocked(axios.get)
      .mockResolvedValueOnce({ data: { company } })
      .mockResolvedValueOnce({ data: { count: 1 } })
      .mockRejectedValue(new Error("Templates unavailable"));
    await mount();
    await flush();
    expect(loaded.creationData.error).toBeNull();
    expect(loaded.creationData.isLoading).toBe(true);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000);
    });
    await flush();
    expect(axios.get).toHaveBeenCalledTimes(4);
    expect(loaded.creationData.error).toBeNull();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(2000);
    });
    await flush();
    expect(axios.get).toHaveBeenCalledTimes(5);
    expect(loaded.creationData.error).toBeTruthy();
    expect(loaded.data.workMap).toHaveLength(1);

    jest.mocked(axios.get).mockResolvedValueOnce({ data: { templates: [] } });
    await act(async () => loaded.creationData.retry());
    await flush();
    expect(axios.get).toHaveBeenCalledTimes(6);
    expect(loaded.creationData).toMatchObject({ isLoading: false, error: null });
  });

  it("preserves usable data during a background refresh and its failure", async () => {
    jest
      .mocked(axios.get)
      .mockResolvedValueOnce({ data: { company } })
      .mockResolvedValueOnce({ data: { count: 1 } })
      .mockResolvedValueOnce({ data: { templates: [] } });
    await mount();
    await flush();
    const request = deferred();
    jest.mocked(axios.get).mockReturnValue(request.promise);
    let refresh: Promise<void>;
    await act(async () => {
      refresh = queryClient.invalidateQueries({ queryKey: Api.companies.getQueryKeyPrefix() });
    });
    expect(loaded.creationData).toMatchObject({ isLoading: false, error: null });
    await act(async () => {
      request.reject(new Error("Offline"));
    });
    await exhaustRetries();
    await act(async () => {
      await refresh;
    });
    await flush();
    expect(loaded.creationData).toMatchObject({ isLoading: false, error: null });
    expect(loaded.data.company?.generalSpace?.id).toBe("general");
  });

  it.each(["/companies/get", "/spaces/count_by_access_level", "/project_templates/list"])(
    "automatically recovers a transient failure of %s",
    async (failingEndpoint) => {
      const responses = {
        "/companies/get": { company },
        "/spaces/count_by_access_level": { count: 1 },
        "/project_templates/list": { templates: [] },
      };
      let attempts = 0;
      jest.mocked(axios.get).mockImplementation(async (url) => {
        if (url.endsWith(failingEndpoint) && ++attempts === 1) throw new Error("Temporary failure");
        const response = Object.entries(responses).find(([endpoint]) => url.endsWith(endpoint));
        if (!response) throw new Error(`Unexpected request: ${url}`);
        return { data: response[1] };
      });
      await mount();
      await flush();
      expect(loaded.creationData).toMatchObject({ isLoading: true, error: null });
      await act(async () => {
        await jest.advanceTimersByTimeAsync(1000);
      });
      await flush();
      expect(attempts).toBe(2);
      expect(axios.get).toHaveBeenCalledTimes(4);
      expect(loaded.creationData).toMatchObject({ isLoading: false, error: null });
    },
  );

  it("does not automatically retry the work-map loader request", async () => {
    jest.mocked(axios.get).mockRejectedValue(new Error("Work map unavailable"));
    await expect(loader()).rejects.toThrow("Work map unavailable");
    await exhaustRetries();
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
  });

  it("accepts company data without General space for minimal-access members", async () => {
    jest
      .mocked(axios.get)
      .mockResolvedValueOnce({ data: { company: { id: "company-1", name: "Company" } } })
      .mockResolvedValueOnce({ data: { count: 0 } })
      .mockResolvedValueOnce({ data: { templates: [] } });
    await mount();
    await flush();
    expect(loaded.creationData).toMatchObject({ isLoading: false, error: null });
    expect(loaded.data.company?.generalSpace).toBeUndefined();
  });
});
