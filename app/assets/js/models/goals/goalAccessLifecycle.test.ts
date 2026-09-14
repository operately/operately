/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { waitFor } from "@/__tests__/renderHook";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import {
  useCreateGoalAccessMembers,
  useUpdateGoalAccessMember,
  useDeleteGoalAccessMember,
  useUpdateGoalAccessLevels,
} from "./goalAccessLifecycle";
import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateGoalAccessQueries } from "./goalAccessLifecycle";

jest.mock("turboui", () => ({}));
beforeAll(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
});

it("invalidates access data for every goal ID variant without touching unrelated resources", async () => {
  const client = new QueryClient();
  const affected = [
    Api.goals.getQueryKey({ id: "goal1" }),
    Api.goals.getQueryKey({ id: "renamed-goal1", includePermissions: true }),
    Api.goals.countChildrenQueryKey({ id: "goal1" }),
    Api.goals.listAccessMembersQueryKey({ goalId: "goal1" }),
    Api.goals.listAccessMembersQueryKey({ goalId: "old-goal1" }),
    Api.people.getBindedQueryKey({ resourseType: "goal", resourseId: "goal1" }),
    Api.people.getBindedQueryKey({ resourseType: "goal", resourseId: "old-goal1" }),
    Api.goals.listQueryKey({}),
    Api.goals.listQueryKey({ includeSpace: true }),
    Api.companies.getWorkMapQueryKey({}),
    Api.companies.getWorkMapQueryKey({ spaceId: "space1" }),
    Api.companies.listActivitiesQueryKey({ scopeType: "goal", scopeId: "goal1", actions: [] }),
  ];
  const unrelated = [
    Api.goals.getQueryKey({ id: "goal2" }),
    Api.goals.listAccessMembersQueryKey({ goalId: "goal2" }),
    Api.people.getBindedQueryKey({ resourseType: "goal", resourseId: "goal2" }),
    Api.people.getBindedQueryKey({ resourseType: "project", resourseId: "goal1" }),
    Api.projects.getQueryKey({ id: "goal1" }),
    Api.projects.listQueryKey({}),
  ];
  [...affected, ...unrelated].forEach((key) => client.setQueryData(key, {}));
  await invalidateGoalAccessQueries(client, "goal1");
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
  ["add members", useCreateGoalAccessMembers, { goalId: "goal1", members: [{ id: "person1", accessLevel: 40 }] }],
  ["update member", useUpdateGoalAccessMember, { goalId: "goal1", personId: "person1", accessLevel: 70 }],
  ["remove member", useDeleteGoalAccessMember, { goalId: "goal1", personId: "person1" }],
  [
    "edit general access",
    useUpdateGoalAccessLevels,
    { goalId: "goal1", accessLevels: { public: 0, company: 10, space: 40 } },
  ],
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

it.each(mutations)("%s waits for invalidation before resolving", async (_name, useHook, input) => {
  const client = new QueryClient();
  let finish = () => {};
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const invalidate = jest.spyOn(client, "invalidateQueries").mockReturnValue(pending);
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
    jest.mocked(axios.post).mockResolvedValueOnce({ data: {} });
    let completed = false;
    let saving: Promise<unknown>;
    act(() => {
      saving = mutate(input).then(() => {
        completed = true;
      });
    });
    await waitFor(() => expect(invalidate).toHaveBeenCalled());
    expect(completed).toBe(false);
    await act(async () => {
      finish();
      await saving;
    });
    expect(completed).toBe(true);
  } finally {
    finish();
    await act(async () => root.unmount());
    client.clear();
  }
});
