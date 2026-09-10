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
      goal: { id: "goal-1", name: "Before" },
      subscribed: true,
    },
  });
  const inputs = await visit();
  expect(inputs).not.toHaveProperty("goal");
  expect(inputs.goalInput?.includeSpace).toBe(true);
  const data = await readLoadedData(inputs);
  expect(data?.goal.name).toBe("Before");
  await visit();
  expect(axios.get).toHaveBeenCalledTimes(3);
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
      goal: { id: "goal-1", name: "Before" },
      subscribed: true,
    },
  });
  await visit();
  await queryClient.invalidateQueries({ queryKey: Api.companies.getActivityQueryKeyPrefix() });
  await visit();
  expect(axios.get).toHaveBeenCalledTimes(4);
});

it("rejects missing required data", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: {} });
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await expect(visit()).rejects.toThrow(/unavailable/);
  } finally {
    error.mockRestore();
  }
});

it("retains the embedded goal when its optional detail query fails", async () => {
  jest.mocked(axios.get).mockImplementation(async (url) => {
    if (String(url).endsWith("/goals/get")) throw new Error("denied");
    return {
      data: {
        activity: {
          id: "activity1",
          action: "goal_discussion_creation",
          content: { goal: { id: "goal1", name: "Embedded" } },
        },
      },
    };
  });
  const inputs = await visit();
  expect(inputs.goalInput).toBeNull();
  expect(inputs.subscriptionInput).toBeNull();
  expect((await readLoadedData(inputs))?.goal.name).toBe("Embedded");
});
