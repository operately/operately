/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api, { type Space } from "@/api";
import { queryClient } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { renderHook, waitFor } from "@/__tests__/renderHook";
import { invalidateSpaceAccessQueries } from "@/models/spaces/spaceAccessLifecycle";
import { loader, useLoadedData, useBindedPeopleList } from "./loader";

jest.mock("axios");
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));

const space = {
  id: "space1",
  name: "Marketing",
  permissions: { has_full_access: true },
  access_levels: { public: 0, company: 10 },
  members: [{ id: "old-person1", full_name: "One" }],
};
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  queryClient.clear();
  jest.clearAllMocks();
  jest.mocked(axios.get).mockResolvedValue({ data: { space } });
});
afterEach(() => queryClient.clear());

async function visit() {
  const inputs = await loader({ params: { id: "space1" } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  return inputs;
}

it("prefetches once and subscribes without a duplicate request", async () => {
  const inputs = await visit();
  expect(inputs).not.toHaveProperty("space");
  expect(inputs.queryInput).toEqual({
    id: "space1",
    includePermissions: true,
    includeMembersAccessLevels: true,
    includeAccessLevels: true,
    includePotentialSubscribers: true,
  });
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.space.name).toBe("Marketing");
  await visit();
  expect(axios.get).toHaveBeenCalledTimes(1);
});

it("refreshes the subscribed space and reloads invalidated data on re-entry", async () => {
  const inputs = await visit();
  const { result, unmount } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  jest.mocked(axios.get).mockResolvedValue({ data: { space: { ...space, members: [] } } });
  await act(() => invalidateSpaceAccessQueries(queryClient, "space1"));
  await waitFor(() => expect(result.current.space.members).toEqual([]));
  unmount();

  await invalidateSpaceAccessQueries(queryClient, "renamed-space1");
  jest.mocked(axios.get).mockResolvedValue({ data: { space: { ...space, name: "Updated" } } });
  await visit();
  expect(queryClient.getQueryData(Api.spaces.getQueryKey(inputs.queryInput))).toMatchObject({
    space: { name: "Updated" },
  });
  expect(axios.get).toHaveBeenCalledTimes(3);
});

it.each([
  [undefined, /Space data/],
  [{ ...space, id: undefined }, /Space data/],
  [{ ...space, permissions: undefined }, /Space permissions/],
  [{ ...space, access_levels: undefined }, /Space access levels/],
  [{ ...space, members: undefined }, /Space members/],
])("rejects missing required space data (%#)", async (response, message) => {
  jest.mocked(axios.get).mockResolvedValue({ data: { space: response } });
  await visit();
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    expect(() => renderHook(useLoadedData, { initialProps: undefined, wrapper })).toThrow(message);
  } finally {
    error.mockRestore();
  }
});

it("preserves loader request errors", async () => {
  jest.mocked(axios.get).mockRejectedValue(new Error("Not found"));
  await expect(visit()).rejects.toThrow("Not found");
});

it("loads inherited people and updates member filtering without hiding cached people during refresh", async () => {
  const inputs = await visit();
  const people = [{ id: "person1" }, { id: "person2" }];
  jest.mocked(axios.get).mockResolvedValue({ data: { people } });
  const { result } = renderHook(useBindedPeopleList, { initialProps: undefined, wrapper });
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.people?.map((p) => p.id)).toEqual(["person2"]));

  let finish = (_value: unknown) => {};
  jest.mocked(axios.get).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  let refreshing: Promise<void>;
  act(() => {
    refreshing = queryClient.invalidateQueries({ queryKey: Api.people.getBindedQueryKeyPrefix() });
  });
  expect(result.current.loading).toBe(false);
  expect(result.current.people?.map((p) => p.id)).toEqual(["person2"]);
  await act(async () => {
    finish({ data: { people } });
    await refreshing;
  });

  const key = Api.spaces.getQueryKey(inputs.queryInput);
  const cachedSpace = queryClient.getQueryData<{ space: Space }>(key)?.space;
  act(() => {
    queryClient.setQueryData(key, { space: { ...cachedSpace, members: people } });
  });
  await waitFor(() => expect(result.current.people).toEqual([]));
  act(() => {
    queryClient.setQueryData(key, { space: { ...cachedSpace, members: [] } });
  });
  await waitFor(() => expect(result.current.people?.map((p) => p.id)).toEqual(["person1", "person2"]));
});

it.each(["missing", "failed"])("handles a %s bound-people response safely", async (response) => {
  await visit();
  if (response === "failed") jest.mocked(axios.get).mockRejectedValue(new Error("Request failed"));
  else jest.mocked(axios.get).mockResolvedValue({ data: {} });
  const { result } = renderHook(useBindedPeopleList, { initialProps: undefined, wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.people).toEqual([]);
});
