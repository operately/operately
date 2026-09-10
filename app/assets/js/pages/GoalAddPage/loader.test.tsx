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

const visit = (query = "") => loader({ request: { url: `https://operately.test/goals/new${query}` } as Request });

it.each([
  ["", []],
  ["?spaceId=space-1", ["/api/v2/spaces/get"]],
  ["?parentGoalId=goal-1", ["/api/v2/goals/get"]],
  ["?spaceId=space-1&parentGoalId=goal-1", ["/api/v2/goals/get", "/api/v2/spaces/get"]],
])("loads only requested creation context: %s", async (query, paths) => {
  jest.mocked(axios.get).mockImplementation(async (path) => ({
    data: path.endsWith("/spaces/get") ? { space: { id: "space-1" } } : { goal: { id: "goal-1" } },
  }));
  const inputs = await visit(query);
  expect(inputs).not.toHaveProperty("space");
  expect(
    jest
      .mocked(axios.get)
      .mock.calls.map(([path]) => path)
      .sort(),
  ).toEqual(paths);
  const data = await readLoadedData(inputs);
  expect(data?.space?.id ?? null).toBe(query.includes("spaceId") ? "space-1" : null);
  expect(data?.parentGoal?.id ?? null).toBe(query.includes("parentGoalId") ? "goal-1" : null);
  jest.mocked(axios.get).mockClear();
  await visit(query);
  expect(axios.get).not.toHaveBeenCalled();
});

it("refetches invalidated parent data on re-entry", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { goal: { id: "goal-1", name: "Before" } } });
  await visit("?parentGoalId=goal-1");
  await queryClient.invalidateQueries({ queryKey: Api.goals.getQueryKeyPrefix() });
  jest.mocked(axios.get).mockResolvedValue({ data: { goal: { id: "goal-1", name: "After" } } });
  expect((await readLoadedData(await visit("?parentGoalId=goal-1")))?.parentGoal?.name).toBe("After");
});

it.each(["?spaceId=missing", "?parentGoalId=missing"])("rejects missing requested context: %s", async (query) => {
  jest.mocked(axios.get).mockResolvedValue({ data: {} });
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await expect(readLoadedData(await visit(query))).rejects.toThrow(/unavailable/);
  } finally {
    error.mockRestore();
  }
});
