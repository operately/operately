/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import axios from "axios";
import React, { act } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import GoalPageModule from "./index";
import { resourceHubDocsInputs, useResourceHubDocsQueries } from "@/models/resourceHubs/docsQueries";
import { renderHook, waitFor } from "@/__tests__/renderHook";

jest.mock("axios");
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({}));
jest.mock("@/models/goals", () => ({ getGoal: (input: object) => require("@/api").default.goals.get(input) }));
jest.mock("@/models/workMap", () => ({ getWorkMap: () => Promise.resolve({ workMap: [] }) }));
jest.mock("@/models/people", () => ({}));
jest.mock("@/models/spaces", () => ({}));
jest.mock("@/models/resourceHubs", () => ({}));
jest.mock("@/models/search/resourceHub", () => ({}));
jest.mock("@/features/Feed", () => ({}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({}));
jest.mock("@/hooks/useRichEditorHandlers", () => ({}));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({}));
jest.mock("./useChecklists", () => ({}));

const goal = { id: "goal-1", resourceHub: { id: "hub-1" } };
const visit = () =>
  GoalPageModule.loader({ params: { id: goal.id }, request: { url: `https://operately.test/goals/${goal.id}` } });

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
  jest.mocked(axios.get).mockImplementation(async (path) => ({
    data: path.endsWith("/goals/get") ? { goal } : {},
  }));
});

afterEach(() => queryClient.clear());

it.each(["get", "list_nodes", "list_drafts"] as const)(
  "loads the goal when resource_hubs/%s fails",
  async (endpoint) => {
    const error = new Error("Docs unavailable");
    jest.mocked(axios.get).mockImplementation(async (path) => {
      if (path === `/api/v2/resource_hubs/${endpoint}`) throw error;
      return { data: path.endsWith("/goals/get") ? { goal } : {} };
    });

    await expect(visit()).resolves.toMatchObject({ data: { goal } });
    // Returning to the cached goal must also tolerate a docs failure.
    await expect(visit()).resolves.toMatchObject({ data: { goal } });

    const inputs = resourceHubDocsInputs("hub-1");
    const keys = {
      get: Api.resource_hubs.getQueryKey(inputs.hubInput),
      list_nodes: Api.resource_hubs.listNodesQueryKey(inputs.nodesInput),
      list_drafts: Api.resource_hubs.listDraftsQueryKey(inputs.draftsInput),
    };
    expect(queryClient.getQueryState(keys[endpoint])?.status).toBe("error");
  },
);

it("still rejects when the core goal request fails", async () => {
  const error = new Error("Goal unavailable");
  jest.mocked(axios.get).mockRejectedValue(error);
  await expect(visit()).rejects.toThrow("Goal unavailable");
});

it("exposes failed drafts to the section and recovers when retried", async () => {
  let draftsUnavailable = true;
  jest.mocked(axios.get).mockImplementation(async (path) => {
    if (path.endsWith("/resource_hubs/list_drafts") && draftsUnavailable) throw new Error("Drafts unavailable");
    return { data: { goal, resourceHub: { id: "hub-1" }, nodes: [], draftNodes: [{ id: "draft-1" }] } };
  });
  await visit();

  const { result } = renderHook(() => useResourceHubDocsQueries("hub-1"), {
    initialProps: undefined,
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });
  await waitFor(() => expect(result.current.error).toBe(true));
  expect(result.current.available).toBe(true);
  expect(result.current.data).toBeNull();

  draftsUnavailable = false;
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.data?.draftNodes).toEqual([{ id: "draft-1" }]));
  expect(result.current.error).toBe(false);
});
