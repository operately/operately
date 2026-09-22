/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@/__tests__/renderHook";
import { useQuerySearch } from "./useQuerySearch";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));

let client: QueryClient;

beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  jest.mocked(axios.get).mockResolvedValue({ data: { people: [] } });
});

afterEach(() => {
  client.clear();
  jest.restoreAllMocks();
});

function mount() {
  return renderHook(
    ({ space, ignoredIds }) =>
      useQuerySearch(
        (query: string) =>
          Api.people.searchQueryOptions({
            query,
            searchScopeType: "space",
            searchScopeId: space,
            ignoredIds,
          }),
        "",
      ),
    {
      initialProps: { space: "space1", ignoredIds: ["ignored1"] },
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    },
  );
}

it("deduplicates concurrent requests and reuses completed searches until invalidated", async () => {
  const hook = mount();

  await Promise.all([hook.result.current("ada"), hook.result.current("ada")]);

  expect(axios.get).toHaveBeenCalledTimes(1);

  await hook.result.current("ada");

  expect(axios.get).toHaveBeenCalledTimes(1);

  await client.invalidateQueries({ queryKey: Api.people.searchQueryKeyPrefix() });
  await hook.result.current("ada");

  expect(axios.get).toHaveBeenCalledTimes(2);
});

it("reuses results for 30 seconds, then fetches fresh results", async () => {
  const now = Date.now();
  const clock = jest.spyOn(Date, "now").mockReturnValue(now);
  const hook = mount();

  await hook.result.current("ada");

  clock.mockReturnValue(now + 29_999);

  await expect(hook.result.current("ada")).resolves.toEqual({ people: [] });
  expect(axios.get).toHaveBeenCalledTimes(1);

  jest.mocked(axios.get).mockResolvedValueOnce({ data: { people: [{ id: "ada" }] } });

  clock.mockReturnValue(now + 30_000);

  await expect(hook.result.current("ada")).resolves.toEqual({ people: [{ id: "ada" }] });
  expect(axios.get).toHaveBeenCalledTimes(2);
});

it("isolates terms, spaces, exclusions, and companies", async () => {
  const hook = mount();

  await hook.result.current("ada");
  await hook.result.current("bob");
  hook.rerender({ space: "space2", ignoredIds: ["ignored1"] });
  await hook.result.current("ada");
  hook.rerender({ space: "space2", ignoredIds: ["ignored2"] });
  await hook.result.current("ada");
  Api.default.setHeaders({ "x-company-id": "company2" });
  hook.rerender({ space: "space2", ignoredIds: ["ignored2"] });
  await hook.result.current("ada");

  expect(axios.get).toHaveBeenCalledTimes(5);
  expect(client.getQueryCache().getAll()).toHaveLength(5);
  expect(jest.mocked(axios.get).mock.calls.at(-1)?.[1]?.headers).toMatchObject({ "x-company-id": "company2" });
});

it("propagates failures and allows the same query to be retried", async () => {
  const hook = mount();
  const error = new Error("offline");
  jest.mocked(axios.get).mockRejectedValueOnce(error);

  await expect(hook.result.current("ada")).rejects.toBe(error);
  await expect(hook.result.current("ada")).resolves.toEqual({ people: [] });
});
