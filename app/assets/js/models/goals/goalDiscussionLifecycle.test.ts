/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { useCreateGoalDiscussion, useEditGoalDiscussion } from "./goalDiscussionLifecycle";
import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateGoalDiscussionQueries } from "./goalDiscussionLifecycle";

jest.mock("turboui", () => ({}));
beforeAll(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
});

it("refreshes the discussion's goal, list and activity variants without touching another discussion", async () => {
  const client = new QueryClient();
  const affected = [
    Api.goals.getQueryKey({ id: "goal1" }),
    Api.goals.countChildrenQueryKey({ id: "renamed-goal1" }),
    Api.goals.listDiscussionsQueryKey({ goalId: "goal1" }),
    Api.goals.listDiscussionsQueryKey({ goalId: "old-goal1" }),
    Api.companies.getActivityQueryKey({ id: "activity1" }),
    Api.companies.getActivityQueryKey({ id: "old-activity1", includePermissions: true }),
    Api.companies.listActivitiesQueryKey({ scopeType: "goal", scopeId: "goal1", actions: [] }),
  ];
  const unrelated = [
    Api.goals.getQueryKey({ id: "goal2" }),
    Api.goals.listDiscussionsQueryKey({ goalId: "goal2" }),
    Api.companies.getActivityQueryKey({ id: "activity2" }),
    Api.goals.getCheckInQueryKey({ id: "check1" }),
  ];
  [...affected, ...unrelated].forEach((key) => client.setQueryData(key, {}));
  await invalidateGoalDiscussionQueries(client, "goal1", "activity1");
  affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  client.clear();
});

jest.mock("axios");
jest.mock("react-router", () => ({}));
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
});

const mutations = [
  ["create", useCreateGoalDiscussion, { goalId: "goal1", title: "Title", message: "{}" }],
  ["edit", () => useEditGoalDiscussion("goal1"), { activityId: "activity1", title: "Title", message: "{}" }],
] as const;

it.each(mutations)("%s invalidates only after a successful mutation", async (_name, useHook, input) => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const goal = Api.goals.getQueryKey({ id: "goal1" });
  const other = Api.goals.getQueryKey({ id: "goal2" });
  [goal, other].forEach((key) => client.setQueryData(key, {}));
  let mutate: (input: any) => Promise<unknown>;
  function Harness() {
    mutate = useHook().mutateAsync as typeof mutate;
    return null;
  }
  const root = createRoot(document.createElement("div"));
  try {
    await act(async () =>
      root.render(React.createElement(QueryClientProvider, { client }, React.createElement(Harness))),
    );
    jest.mocked(axios.post).mockRejectedValueOnce(new Error("Save failed"));
    await act(async () => {
      await expect(mutate(input)).rejects.toThrow("Save failed");
    });
    expect(client.getQueryState(goal)?.isInvalidated).toBe(false);
    jest.mocked(axios.post).mockResolvedValueOnce({ data: { activity_id: "activity1", update: { id: "check1" } } });
    await act(async () => {
      await mutate(input);
    });
    expect(client.getQueryState(goal)?.isInvalidated).toBe(true);
    expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  } finally {
    await act(async () => root.unmount());
    client.clear();
  }
});
