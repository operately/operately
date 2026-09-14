/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { renderHook, waitFor } from "@/__tests__/renderHook";
import { invalidateGoalAccessQueries } from "@/models/goals/goalAccessLifecycle";
import { loader, useLoadedData, useBindedPeopleList } from "./loader";

jest.mock("axios");
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
  queryClient.clear();
  jest.clearAllMocks();
});
afterEach(() => queryClient.clear());

async function readLoadedData(inputs: Awaited<ReturnType<typeof loader>>) {
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  let result: ReturnType<typeof useLoadedData> | undefined;
  function Harness() {
    result = useLoadedData();
    return null;
  }
  const root = createRoot(document.createElement("div"));
  try {
    await act(async () =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <Harness />
        </QueryClientProvider>,
      ),
    );
    return result;
  } finally {
    await act(async () => root.unmount());
  }
}

const visit = () => loader({ params: { goalId: "goal1" } });

it("prefetches and reads cached data without a duplicate request", async () => {
  jest.mocked(axios.get).mockResolvedValue({
    data: {
      goal: {
        id: "goal1",
        name: "Before",
        space: { name: "Space" },
        access_levels: { public: 0, company: 10, space: 40 },
      },
    },
  });
  const inputs = await visit();
  expect(inputs).not.toHaveProperty("goal");
  const data = await readLoadedData(inputs);
  expect(data?.goal.name).toBe("Before");
  await visit();
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(inputs.queryInput.includeSpace).toBe(true);
});

it("fetches fresh data after invalidation and re-entry", async () => {
  jest.mocked(axios.get).mockResolvedValue({
    data: {
      goal: {
        id: "goal1",
        name: "Before",
        space: { name: "Space" },
        access_levels: { public: 0, company: 10, space: 40 },
      },
    },
  });
  await visit();
  await queryClient.invalidateQueries({ queryKey: Api.goals.getQueryKeyPrefix() });
  jest.mocked(axios.get).mockResolvedValue({
    data: {
      goal: { id: "goal1", name: "After", access_levels: { public: 0, company: 10, space: 40 } },
    },
  });
  expect((await readLoadedData(await visit()))?.goal.name).toBe("After");
  expect(axios.get).toHaveBeenCalledTimes(3);
});

it("rejects missing required data", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: {} });
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await expect(readLoadedData(await visit())).rejects.toThrow(/unavailable/);
  } finally {
    error.mockRestore();
  }
});

it("defaults a missing member list to empty", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { goal: { id: "goal1" } } });
  expect((await readLoadedData(await visit()))?.accessMembers).toEqual([]);
});

it("sorts direct members without mutating the cached list", async () => {
  jest.mocked(axios.get).mockResolvedValue({
    data: {
      goal: { id: "goal1" },
      people: [
        { id: "zed", full_name: "Zed" },
        { id: "amy", full_name: "Amy" },
      ],
    },
  });
  const inputs = await visit();
  expect((await readLoadedData(inputs))?.accessMembers.map((p) => p.id)).toEqual(["amy", "zed"]);
  expect(
    queryClient.getQueryData(Api.goals.listAccessMembersQueryOptions(inputs.accessMembersInput).queryKey),
  ).toMatchObject({ people: [{ id: "zed" }, { id: "amy" }] });
});

it("automatically loads inherited access, keeps cached people during refresh and updates direct-member filtering", async () => {
  jest.mocked(axios.get).mockResolvedValue({
    data: {
      goal: { id: "goal1" },
      people: [{ id: "old-person1", full_name: "One" }],
    },
  });
  const inputs = await visit();
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  jest.mocked(axios.get).mockResolvedValue({
    data: {
      people: [
        { id: "person1", full_name: "One" },
        { id: "person2", full_name: "Two" },
      ],
    },
  });
  const { result } = renderHook(useBindedPeopleList, {
    initialProps: undefined,
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });
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
    finish({
      data: {
        people: [
          { id: "person1", full_name: "One" },
          { id: "person2", full_name: "Two" },
        ],
      },
    });
    await refreshing;
  });
  jest.mocked(axios.get).mockResolvedValue({
    data: {
      goal: { id: "goal1" },
      people: [
        { id: "person1", full_name: "One" },
        { id: "person2", full_name: "Two" },
      ],
    },
  });
  await act(() => invalidateGoalAccessQueries(queryClient, "goal1"));
  await waitFor(() => expect(result.current.people).toEqual([]));

  act(() => {
    queryClient.setQueryData(Api.goals.listAccessMembersQueryKey(inputs.accessMembersInput), { people: [] });
  });
  await waitFor(() => expect(result.current.people?.map((p) => p.id)).toEqual(["person1", "person2"]));
});

// jsdom does not provide the Fetch API's Response constructor.
describe("loader errors", () => {
  beforeEach(() => {
    jest
      .spyOn(Api.goals, "getQuery")
      .mockResolvedValue({ goal: { id: "goal1" } } as Awaited<ReturnType<typeof Api.goals.getQuery>>);
  });

  afterEach(() => jest.restoreAllMocks());

  it("maps forbidden access-member requests to the not-found route", async () => {
    const originalResponse = Object.getOwnPropertyDescriptor(globalThis, "Response");
    const notFound = { status: 404 };
    const responseConstructor = jest.fn().mockReturnValue(notFound);
    Object.defineProperty(globalThis, "Response", { configurable: true, value: responseConstructor });
    jest.spyOn(Api.goals, "listAccessMembersQuery").mockRejectedValue({ status: 403 });

    try {
      await expect(visit()).rejects.toBe(notFound);
      expect(responseConstructor).toHaveBeenCalledWith("Not Found", { status: 404 });
    } finally {
      if (originalResponse) Object.defineProperty(globalThis, "Response", originalResponse);
      else Reflect.deleteProperty(globalThis, "Response");
    }
  });

  it("preserves other access-member errors", async () => {
    const error = new Error("Network failed");
    jest.spyOn(Api.goals, "listAccessMembersQuery").mockRejectedValue(error);
    await expect(visit()).rejects.toBe(error);
  });
});
