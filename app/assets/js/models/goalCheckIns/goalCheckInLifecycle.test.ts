/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import {
  usePostGoalProgressUpdate,
  useEditGoalProgressUpdate,
  useDeleteGoalProgressUpdate,
  useAcknowledgeGoalProgressUpdate,
} from "./goalCheckInLifecycle";
import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateGoalCheckInQueries } from "./goalCheckInLifecycle";

jest.mock("turboui", () => ({}));

beforeAll(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
});

it("refreshes the affected goal, check-in variants and associated activities only", async () => {
  const client = new QueryClient();

  const affected = [
    Api.goals.getQueryKey({ id: "goal1" }),
    Api.goals.countChildrenQueryKey({ id: "goal1" }),
    Api.goals.listCheckInsQueryKey({ goalId: "old-goal1" }),
    Api.goals.getCheckInQueryKey({ id: "check1" }),
    Api.goals.getCheckInQueryKey({ id: "old-check1", includeGoal: true }),
    Api.goals.listQueryKey({}),
    Api.companies.getWorkMapQueryKey({ spaceId: "space1" }),
  ];

  const unrelated = [
    Api.goals.getQueryKey({ id: "goal2" }),
    Api.goals.listCheckInsQueryKey({ goalId: "goal2" }),
    Api.goals.getCheckInQueryKey({ id: "check2" }),
    Api.companies.getActivityQueryKey({ id: "activity2" }),
    Api.projects.listQueryKey({}),
  ];

  [...affected, ...unrelated].forEach((key) => client.setQueryData(key, {}));

  const activity = Api.companies.getActivityQueryKey({ id: "activity1" });
  const variant = Api.companies.getActivityQueryKey({ id: "renamed-activity1", includePermissions: true });
  client.setQueryData(activity, { activity: { id: "activity1", content: { update: { id: "old-check1" } } } });
  client.setQueryData(variant, {});

  const editActivity = Api.companies.getActivityQueryKey({ id: "activity3" });
  client.setQueryData(editActivity, { activity: { id: "activity3", content: { checkInId: "check1" } } });

  await invalidateGoalCheckInQueries(client, "goal1", "check1");

  [...affected, activity, variant, editActivity].forEach((key) =>
    expect(client.getQueryState(key)?.isInvalidated).toBe(true),
  );
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
  ["create", usePostGoalProgressUpdate, { goalId: "goal1", content: "{}" }],
  ["edit", () => useEditGoalProgressUpdate("goal1"), { id: "check1", content: "{}" }],
  ["delete", () => useDeleteGoalProgressUpdate("goal1"), { id: "check1" }],
  ["acknowledge", () => useAcknowledgeGoalProgressUpdate("goal1"), { id: "check1" }],
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
