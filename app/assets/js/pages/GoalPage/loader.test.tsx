/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { renderHook } from "@/__tests__/renderHook";
import { invalidateGoalPageQueries } from "@/models/goals/goalPageQueries";
import { loader, useLoadedData } from "./loader";

jest.mock("axios");
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));

const response = (name = "Before") => ({
  data: {
    goal: {
      id: "goal1",
      name,
      permissions: { can_edit: true },
      privacy: "private",
      access_levels: { public: 0, company: 10, space: 40 },
    },
    work_map: [],
    check_ins: [],
    discussions: [],
    children_count: { check_ins_count: 0, discussions_count: 0, docs_and_files_count: 0 },
  },
});
const visit = () => loader({ params: { id: "goal1" } });
const read = (inputs: Awaited<ReturnType<typeof loader>>) => {
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  return renderHook(useLoadedData, {
    initialProps: undefined,
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });
};
beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  queryClient.clear();
  jest.clearAllMocks();
  jest.mocked(axios.get).mockResolvedValue(response());
});
afterEach(() => queryClient.clear());

it("prefetches every core query and reuses them on mount and re-entry without a resource hub", async () => {
  const inputs = await visit();
  expect(inputs).not.toHaveProperty("data");
  const { result } = read(inputs);
  expect(result.current.data.goal.name).toBe("Before");
  expect(result.current.data.workMap).toEqual([]);
  expect(result.current.data.checkIns).toEqual([]);
  expect(result.current.data.discussions).toEqual([]);
  await visit();
  expect(axios.get).toHaveBeenCalledTimes(5);
});

it("refreshes all core data after invalidation and re-entry", async () => {
  await visit();
  await invalidateGoalPageQueries(queryClient, "renamed-goal1");
  jest.mocked(axios.get).mockResolvedValue(response("After"));
  const { result } = read(await visit());
  expect(result.current.data.goal.name).toBe("After");
  expect(axios.get).toHaveBeenCalledTimes(10);
});

it("rejects missing goal data", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: {} });
  await expect(visit()).rejects.toThrow(/Goal data is unavailable/);
});

it.each(["permissions", "privacy", "access_levels"])("rejects missing required %s", async (field) => {
  const res = response();
  jest.mocked(axios.get).mockResolvedValue({ data: { ...res.data, goal: { ...res.data.goal, [field]: null } } });
  const inputs = await visit();
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    expect(() => read(inputs)).toThrow(/Goal data is unavailable/);
  } finally {
    log.mockRestore();
  }
});

it("keeps docs failures local to the Docs & Files tab", async () => {
  jest.mocked(axios.get).mockImplementation(async (url) => {
    if (String(url).includes("resource_hubs")) throw new Error("Docs unavailable");
    const res = response();
    return { data: { ...res.data, goal: { ...res.data.goal, resource_hub: { id: "hub1" } } } };
  });
  const { result } = read(await visit());
  expect(result.current.data.goal.id).toBe("goal1");
  expect(axios.get).toHaveBeenCalledTimes(8);
});

it("reads the goal-specific discussion payload used by the serializer", async () => {
  const res = response();
  jest.mocked(axios.get).mockResolvedValue({
    data: {
      ...res.data,
      discussions: [
        {
          id: "discussion1",
          title: "Topic",
          inserted_at: "2026-09-14T00:00:00Z",
          activity_id: "activity1",
          comment_count: 2,
          content: "{}",
          author: { id: "person1" },
        },
      ],
    },
  });
  const { result } = read(await visit());
  expect(result.current.data.discussions[0]).toMatchObject({ activityId: "activity1", commentCount: 2, content: "{}" });
});

it("rejects missing required child data instead of showing an incomplete page", async () => {
  const res = response();
  jest.mocked(axios.get).mockResolvedValue({ data: { ...res.data, children_count: undefined } });
  const inputs = await visit();
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    expect(() => read(inputs)).toThrow(/Goal content is unavailable/);
  } finally {
    log.mockRestore();
  }
});
