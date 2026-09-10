/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api, { Goal } from "@/api";
import { PageCache } from "@/routes/PageCache";
import { useLoadedData } from "./loader";
import page from "./index";

const mockNavigate = jest.fn();
let mockProps: { save: (input: object) => Promise<{ id: string }>; onSuccess: (id: string) => void };
jest.mock("axios");
jest.mock("react-router", () => ({ useNavigate: () => mockNavigate }));
jest.mock("./loader", () => ({ loader: jest.fn(), useLoadedData: jest.fn() }));
jest.mock("@/routes/paths", () => ({
  compareIds: jest.requireActual("@/routes/paths").compareIds,
  usePaths: () => ({ goalPath: (id) => `/goals/${id}`, spacePath: (id) => `/spaces/${id}` }),
}));
jest.mock("@/routes/PageCache", () => ({ PageCache: { invalidate: jest.fn() } }));
jest.mock("@/pages/GoalPage", () => ({ pageCacheKey: (id) => `goal:${id}` }));
jest.mock("@/models/spaces", () => ({ useSpaceSearch: jest.fn() }));
jest.mock("turboui", () => ({
  GoalAddPage: (props) => {
    mockProps = props;
    return null;
  },
}));

const values = { name: "New Goal", spaceId: "space-1", accessLevels: { company: "view", space: "edit" } };

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
  jest.clearAllMocks();
});

it.each([false, true])("creates a goal and keeps cached views fresh (with parent: %s)", async (withParent) => {
  jest
    .mocked(useLoadedData)
    .mockReturnValue({ space: null, parentGoal: withParent ? ({ id: "parent-1" } as Goal) : null });
  jest.mocked(axios.post).mockResolvedValue({ data: { goal: { id: "new-goal" } } });
  const client = new QueryClient();
  const key = Api.companies.getWorkMapQueryKey({ spaceId: "space-1" });
  const goalKey = Api.goals.getQueryKey({ id: "new-goal", includeMarkdown: true });
  const parentKey = Api.goals.getQueryKey({ id: "parent-1" });
  const unrelatedKey = Api.goals.getQueryKey({ id: "other-2" });
  [key, goalKey, parentKey, unrelatedKey].forEach((queryKey) => client.setQueryData(queryKey, {}));
  const root = createRoot(document.createElement("div"));
  try {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <page.Page />
        </QueryClientProvider>,
      ),
    );
    await act(async () => {
      const result = await mockProps.save(values);
      mockProps.onSuccess(result.id);
    });
    expect(axios.post).toHaveBeenCalledWith(
      "/api/v2/goals/create",
      expect.objectContaining({
        name: "New Goal",
        space_id: "space-1",
        ...(withParent ? { parent_goal_id: "parent-1" } : {}),
        anonymous_access_level: 0,
        company_access_level: 10,
        space_access_level: 70,
      }),
      expect.anything(),
    );
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(client.getQueryState(goalKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(parentKey)?.isInvalidated).toBe(withParent);
    expect(client.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
    expect(PageCache.invalidate).toHaveBeenCalledTimes(withParent ? 1 : 0);
    if (withParent) expect(PageCache.invalidate).toHaveBeenCalledWith("goal:parent-1");
    expect(mockNavigate).toHaveBeenCalledWith("/goals/new-goal");
  } finally {
    await act(async () => root.unmount());
    client.clear();
  }
});

it("propagates a failed creation without invalidation or navigation", async () => {
  jest.mocked(useLoadedData).mockReturnValue({ space: null, parentGoal: { id: "parent-1" } as Goal });
  jest.mocked(axios.post).mockRejectedValue(new Error("Creation failed"));
  const client = new QueryClient();
  const key = Api.goals.listQueryKey({});
  client.setQueryData(key, {});
  const root = createRoot(document.createElement("div"));
  try {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <page.Page />
        </QueryClientProvider>,
      ),
    );
    await act(async () => {
      await expect(mockProps.save(values)).rejects.toThrow("Creation failed");
    });
    expect(client.getQueryState(key)?.isInvalidated).toBe(false);
    expect(PageCache.invalidate).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    client.clear();
  }
});
