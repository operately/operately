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

const visit = () => loader({ params: { id: "activity1" } });

it("prefetches and reads cached data without a duplicate request", async () => {
  jest.mocked(axios.get).mockResolvedValue({
    data: {
      activity: {
        id: "activity1",
        action: "goal_discussion_creation",
        content: { goal: { id: "goal-1", name: "Before" } },
        commentThread: { id: "thread1" },
      },
    },
  });
  const inputs = await visit();
  expect(inputs).not.toHaveProperty("goal");
  const data = await readLoadedData(inputs);
  expect(data?.goal.name).toBe("Before");
  await visit();
  expect(axios.get).toHaveBeenCalledTimes(1);
});

it("fetches fresh data after invalidation and re-entry", async () => {
  jest.mocked(axios.get).mockResolvedValue({
    data: {
      activity: {
        id: "activity1",
        action: "goal_discussion_creation",
        content: { goal: { id: "goal-1", name: "Before" } },
        commentThread: { id: "thread1" },
      },
    },
  });
  await visit();
  await queryClient.invalidateQueries({ queryKey: Api.companies.getActivityQueryKeyPrefix() });
  jest.mocked(axios.get).mockResolvedValue({
    data: {
      activity: {
        id: "activity1",
        action: "goal_discussion_creation",
        content: { goal: { id: "goal-1", name: "After" } },
        commentThread: { id: "thread1" },
      },
    },
  });
  expect((await readLoadedData(await visit()))?.goal.name).toBe("After");
  expect(axios.get).toHaveBeenCalledTimes(2);
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
