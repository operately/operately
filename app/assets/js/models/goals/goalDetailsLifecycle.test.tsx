/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { QueryClient, QueryClientProvider, QueryObserver } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import * as Lifecycle from "./goalDetailsLifecycle";

jest.mock("axios");
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));
let client: QueryClient;
beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  jest.clearAllMocks();
});
afterEach(() => client.clear());
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

const fields = [
  ["name", Lifecycle.useUpdateGoalName, { name: "New" }],
  ["description", Lifecycle.useUpdateGoalDescription, { description: "{}" }],
  ["start date", Lifecycle.useUpdateGoalStartDate, { startDate: null }],
  ["due date", Lifecycle.useUpdateGoalDueDate, { dueDate: null }],
  ["space", Lifecycle.useUpdateGoalSpace, { spaceId: "space1" }],
  ["champion", Lifecycle.useUpdateGoalChampion, { championId: null }],
  ["reviewer", Lifecycle.useUpdateGoalReviewer, { reviewerId: null }],
] as const;

it.each(fields)("%s refreshes affected views only after a successful response", async (_field, useHook, input) => {
  const goal = Api.goals.getQueryKey({ id: "old-goal1" });
  const other = Api.goals.getQueryKey({ id: "goal2" });
  const workMap = Api.companies.getWorkMapQueryKey({ parentGoalId: "parent1" });
  const activity = Api.companies.listActivitiesQueryKey({ scopeType: "goal", scopeId: "goal1", actions: [] });
  [goal, other, workMap, activity].forEach((key) => client.setQueryData(key, {}));
  const { result } = renderHook(() => useHook(), { initialProps: undefined, wrapper });
  const save = result.current.mutateAsync as (input: any) => Promise<unknown>;
  jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: false } });
  await act(async () => {
    await expect(save({ goalId: "goal1", ...input })).rejects.toThrow();
  });
  expect(client.getQueryState(goal)?.isInvalidated).toBe(false);
  jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } });
  await act(async () => {
    await save({ goalId: "goal1", ...input });
  });
  [goal, workMap, activity].forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  expect(client.getQueryState(other)?.isInvalidated).toBe(false);
});

it.each([Lifecycle.useUpdateGoalSpace, Lifecycle.useUpdateGoalChampion, Lifecycle.useUpdateGoalReviewer])(
  "refreshes direct and inherited access without touching project access",
  async (useHook) => {
    const members = Api.goals.listAccessMembersQueryKey({ goalId: "old-goal1" });
    const people = Api.people.getBindedQueryKey({ resourseType: "goal", resourseId: "goal1" });
    const project = Api.people.getBindedQueryKey({ resourseType: "project", resourseId: "goal1" });
    [members, people, project].forEach((key) => client.setQueryData(key, {}));
    const { result } = renderHook(() => useHook(), { initialProps: undefined, wrapper });
    jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } });
    await act(async () => {
      await (result.current.mutateAsync as (input: any) => Promise<unknown>)({
        goalId: "goal1",
        spaceId: "space1",
        championId: null,
        reviewerId: null,
      });
    });
    expect(client.getQueryState(members)?.isInvalidated).toBe(true);
    expect(client.getQueryState(people)?.isInvalidated).toBe(true);
    expect(client.getQueryState(project)?.isInvalidated).toBe(false);
  },
);

it("reparenting invalidates both parents and their child lists", async () => {
  const keys = ["old", "new"].flatMap((id) => [
    Api.goals.getQueryKey({ id }),
    Api.companies.getWorkMapQueryKey({ parentGoalId: id }),
  ]);
  keys.forEach((key) => client.setQueryData(key, {}));
  const { result } = renderHook(() => Lifecycle.useUpdateGoalParentGoal("old"), { initialProps: undefined, wrapper });
  jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } });
  await act(async () => {
    await result.current.mutateAsync({ goalId: "goal1", parentGoalId: "new" });
  });
  keys.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
});

it("keeps the original parent for invalidation when query data changes during a save", async () => {
  const oldParent = Api.goals.getQueryKey({ id: "old-parent1" });
  const newParent = Api.goals.getQueryKey({ id: "new-parent2" });
  const unrelated = Api.goals.getQueryKey({ id: "parent3" });
  [oldParent, newParent, unrelated].forEach((key) => client.setQueryData(key, {}));
  let finish = (_value: unknown) => {};
  jest.mocked(axios.post).mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const { result, rerender } = renderHook(Lifecycle.useUpdateGoalParentGoal, { initialProps: "parent1", wrapper });
  let saving: Promise<unknown>;
  act(() => {
    saving = result.current.mutateAsync({ goalId: "goal1", parentGoalId: "parent2" });
  });
  await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
  rerender("parent3");
  await act(async () => {
    finish({ data: { success: true } });
    await saving;
  });
  expect(client.getQueryState(oldParent)?.isInvalidated).toBe(true);
  expect(client.getQueryState(newParent)?.isInvalidated).toBe(true);
  expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
});

it("deletion refreshes parent and listings without refetching the deleted goal or its child list", async () => {
  const goal = Api.goals.getQueryKey({ id: "old-goal1" });
  const ownChildren = Api.companies.getWorkMapQueryKey({ parentGoalId: "goal1" });
  const parent = Api.goals.getQueryKey({ id: "parent1" });
  const listings = Api.goals.listQueryKey({});
  [goal, ownChildren, parent, listings].forEach((key) => client.setQueryData(key, {}));
  const fetch = jest.fn().mockResolvedValue({});
  const stops = [goal, ownChildren].map((queryKey) =>
    new QueryObserver(client, { queryKey, queryFn: fetch, staleTime: Infinity }).subscribe(() => {}),
  );
  try {
    const { result } = renderHook(() => Lifecycle.useDeleteGoal("parent1"), { initialProps: undefined, wrapper });
    jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } });
    await act(async () => {
      await result.current.mutateAsync({ goalId: "goal1" });
    });
    expect(fetch).not.toHaveBeenCalled();
    [goal, ownChildren, parent, listings].forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  } finally {
    stops.forEach((stop) => stop());
  }
});
