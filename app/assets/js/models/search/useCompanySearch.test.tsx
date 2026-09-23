/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { useCompanySearch } from "./useCompanySearch";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("react-router", () => ({
  useSearchParams: () => jest.requireActual("react").useState(new URLSearchParams("q=roadmap")),
}));
jest.mock("turboui", () => ({ searchTimeFilterOptions: () => [], searchTypeFilterOptions: () => [] }));

let client: QueryClient;

beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  jest.mocked(axios.get).mockResolvedValue({ data: { results: [{ id: "first" }] } });
});

afterEach(() => client.clear());

function mount() {
  return renderHook(() => useCompanySearch([{ id: "space1", name: "Space" }]), {
    initialProps: undefined,
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}

it("loads URL queries immediately and debounces typing and filter changes with distinct cache keys", async () => {
  const hook = mount();

  await waitFor(() => expect(hook.result.current.status).toBe("success"));

  act(() => hook.result.current.onQueryChange("plan"));

  expect(axios.get).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

  act(() => hook.result.current.refine.onFilterChange("spaces", ["space1"]));

  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

  act(() => hook.result.current.refine.onSortChange("most_recent"));

  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(4));
  expect(jest.mocked(axios.get).mock.calls.at(-1)?.[1]?.params).toMatchObject({
    query: "plan",
    space_ids: ["space1"],
    sort: "most_recent",
  });

  act(() => hook.result.current.onQueryChange("p"));

  expect(hook.result.current.status).toBe("initial");
  expect(hook.result.current.results).toEqual([]);
  expect(client.getQueryCache().getAll()).toHaveLength(4);
});

it("ignores stale responses during the debounce window and recovers after an error", async () => {
  let resolveOld: (result: unknown) => void = () => {};
  jest.mocked(axios.get).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
  );
  const hook = mount();

  act(() => hook.result.current.onQueryChange("new"));
  await act(async () => resolveOld({ data: { results: [{ id: "stale" }] } }));

  expect(hook.result.current.results).toEqual([]);
  await waitFor(() => expect(hook.result.current.status).toBe("success"));

  jest.mocked(axios.get).mockRejectedValueOnce(new Error("offline"));

  act(() => hook.result.current.onQueryChange("failure"));

  await waitFor(() => expect(hook.result.current.status).toBe("error"));

  act(() => hook.result.current.onQueryChange("recovered"));

  await waitFor(() => expect(hook.result.current.status).toBe("success"));
});
