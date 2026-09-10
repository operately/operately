/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { loader, useLoadedData } from "./loader";

jest.mock("axios");
jest.mock("react-router", () => ({ useRouteLoaderData: jest.fn() }));
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

const goal = { id: "goal-1", name: "Parent", space: { name: "Space" }, potentialSubscribers: [] };
const visit = () => loader({ params: { goalId: goal.id, companyId: "company-1" } });
function respond(goals: object[], projects: object[]) {
  jest.mocked(axios.get).mockImplementation(async (path) => ({
    data: path.endsWith("/goals/get") ? { goal } : path.endsWith("/goals/list") ? { goals } : { projects },
  }));
}

it("derives the warning from real cached goal and project queries", async () => {
  respond(
    [
      { id: "child", parentGoalId: goal.id, name: "Child", isClosed: false },
      { id: "closed", parentGoalId: goal.id, name: "Closed", isClosed: true },
      { id: "grandchild", parentGoalId: "closed", name: "Grandchild", isClosed: false },
      { id: "unrelated", parentGoalId: null, name: "Unrelated", isClosed: false },
    ],
    [
      { id: "active-project", goalId: goal.id, name: "Active", state: "active" },
      { id: "paused-project", goalId: "child", name: "Paused", state: "paused" },
      { id: "closed-project", goalId: goal.id, state: "closed" },
      { id: "unrelated-project", goalId: "unrelated", state: "active" },
      { id: "closed-goal-project", goalId: "closed", state: "active" },
    ],
  );
  const inputs = await visit();
  expect(inputs).not.toHaveProperty("activeSubitems");
  const data = await readLoadedData(inputs);
  expect(data?.activeSubitems.map(({ id }) => id)).toEqual(["child", "grandchild", "active-project", "paused-project"]);
  expect(data?.activeSubitems[0]).toMatchObject({
    type: "goal",
    name: "Child",
    link: expect.stringContaining("child"),
  });
  expect(data?.activeSubitems[2]).toMatchObject({ type: "project", link: expect.stringContaining("active-project") });
  await visit();
  expect(axios.get).toHaveBeenCalledTimes(3);
});

it.each([{ projects: [] }, { projects: [{ id: "closed-project", goalId: goal.id, state: "closed" }] }])(
  "has no warning for inactive or absent projects",
  async ({ projects }) => {
    respond([], projects);
    expect((await readLoadedData(await visit()))?.activeSubitems).toEqual([]);
  },
);

it("refreshes the warning after project-list invalidation", async () => {
  respond([], [{ id: "project-1", goalId: goal.id, name: "Project", state: "active" }]);
  await visit();
  await queryClient.invalidateQueries({ queryKey: Api.projects.listQueryKeyPrefix() });
  respond([], [{ id: "project-1", goalId: goal.id, state: "closed" }]);
  expect((await readLoadedData(await visit()))?.activeSubitems).toEqual([]);
  expect(axios.get).toHaveBeenCalledTimes(4);
});

it.each(["/goals/get", "/goals/list", "/projects/list"])("rejects missing data from %s", async (missing) => {
  respond([], []);
  const response = jest.mocked(axios.get).getMockImplementation();
  jest
    .mocked(axios.get)
    .mockImplementation(async (path, config) => (path.endsWith(missing) ? { data: {} } : response?.(path, config)));
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await expect(readLoadedData(await visit())).rejects.toThrow(/unavailable/);
  } finally {
    error.mockRestore();
  }
});
