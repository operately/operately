/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Pages from "@/components/Pages";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { loader, useLoadedData } from "./loader";
import { invalidateTaskLifecycleQueries } from "@/models/tasks/taskLifecycle";
import { invalidateMilestoneLifecycleQueries } from "@/models/milestones/milestoneLifecycle";
import { invalidateProjectLifecycleQueries } from "@/models/projects/projectLifecycle";
import { invalidateGoalLifecycleQueries } from "@/models/goals/goalLifecycle";
import { invalidateGoalAccessQueries } from "@/models/goals/goalAccessLifecycle";
import { invalidateGoalPageQueries } from "@/models/goals/goalPageQueries";
import { invalidateSpaceLifecycleQueries, invalidateDeletedSpaceQueries } from "@/models/spaces/spaceLifecycle";
import { invalidateSpaceAccessQueries } from "@/models/spaces/spaceAccessLifecycle";
import { invalidateSpaceTaskQueries } from "@/models/spaces/spaceTaskLifecycle";
import { invalidateWorkMapQueries } from "@/models/workMap";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/components/Pages", () => ({
  useLoadedData: jest.fn(),
  getSearchParam: (request: { url: string }, name: string) => new URL(request.url).searchParams.get(name),
}));
jest.mock("react-router", () => ({}));

const person = { id: "person1", fullName: "Original", manager: { id: "manager1" } };
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("/get_flat_work_map") ? { workMap: [] } : { person, me: person },
  }));
});
afterEach(() => queryClient.clear());

async function visit(id = "person1") {
  const args = { params: { id }, request: { url: "http://localhost/edit?from=admin-manage-people" } };
  const inputs = await loader(args);
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  return inputs;
}

it("reuses prefetched data on mount and route re-entry", async () => {
  const inputs = await visit();
  expect(inputs).not.toHaveProperty("person");
  expect(inputs).not.toHaveProperty("data");
  const { result, unmount } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.person.fullName).toBe("Original");
  expect(result.current.workMap).toEqual([]);
  expect(result.current.reviewerWorkMap).toEqual([]);
  unmount();
  await visit();
  renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(axios.get).toHaveBeenCalledTimes(3);
});

it("updates mounted data on invalidation and retains it after a background failure", async () => {
  await visit();
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  jest.mocked(axios.get).mockResolvedValue({ data: { person: { ...person, fullName: "Updated" } } });
  await act(() => queryClient.invalidateQueries({ queryKey: Api.people.getQueryKeyPrefix() }));
  await waitFor(() => expect(result.current.person.fullName).toBe("Updated"));
  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  await act(() => queryClient.invalidateQueries({ queryKey: Api.people.getQueryKeyPrefix() }));
  expect(result.current.person.fullName).toBe("Updated");
});

it("uses the current-user query only for a matching self-profile 404", async () => {
  jest.mocked(axios.get).mockImplementation(async (url) => {
    if (url.endsWith("/people/get")) throw { status: 404 };
    return { data: url.endsWith("/get_flat_work_map") ? { workMap: [] } : { me: person } };
  });
  await visit();
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.person.id).toBe("person1");
  expect(axios.get).toHaveBeenCalledTimes(4);
  jest.mocked(axios.get).mockResolvedValue({ data: { me: { ...person, fullName: "Updated self" } } });
  await act(() => queryClient.invalidateQueries({ queryKey: Api.people.getMeQueryKeyPrefix() }));
  await waitFor(() => expect(result.current.person.fullName).toBe("Updated self"));
});

it.each([null, { id: "someone-else" }])("preserves 404 when the current user does not match: %p", async (me) => {
  jest.mocked(axios.get).mockImplementation(async (url) => {
    if (url.endsWith("/people/get")) throw { status: 404 };
    return { data: url.endsWith("/get_flat_work_map") ? { workMap: [] } : { me } };
  });
  await expect(visit()).rejects.toMatchObject({ status: 404 });
});

it.each([403, 500])("does not use the current-user fallback for status %s", async (status) => {
  jest.mocked(axios.get).mockImplementation(async (url) => {
    if (url.endsWith("/people/get")) throw { status };
    return { data: { workMap: [] } };
  });
  await expect(visit()).rejects.toMatchObject({ status });
  expect(jest.mocked(axios.get).mock.calls.some(([url]) => url.endsWith("/get_me"))).toBe(false);
});

it("does not reuse a different person's cached profile", async () => {
  await visit();
  jest.mocked(axios.get).mockResolvedValue({ data: { person: { ...person, id: "person2" }, workMap: [] } });
  await visit("person2");
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.person.id).toBe("person2");
});

it.each([
  ["task changes", () => invalidateTaskLifecycleQueries(queryClient)],
  ["milestone changes", () => invalidateMilestoneLifecycleQueries(queryClient)],
  ["project changes", () => invalidateProjectLifecycleQueries(queryClient)],
  ["goal changes", () => invalidateGoalLifecycleQueries(queryClient, "goal1")],
  ["goal access changes", () => invalidateGoalAccessQueries(queryClient, "goal1")],
  ["goal page changes", () => invalidateGoalPageQueries(queryClient, "goal1")],
  ["space changes", () => invalidateSpaceLifecycleQueries(queryClient, "space1")],
  ["space deletion", () => invalidateDeletedSpaceQueries(queryClient, "space1")],
  ["space access changes", () => invalidateSpaceAccessQueries(queryClient, "space1")],
  ["space task status changes", () => invalidateSpaceTaskQueries(queryClient)],
  ["work map creation", () => invalidateWorkMapQueries(queryClient)],
] as const)("refreshes both personal work maps on re-entry after %s", async (_name, invalidate) => {
  const { workMapInput, reviewerWorkMapInput } = await visit();
  await invalidate();
  expect(queryClient.getQueryState(Api.companies.getFlatWorkMapQueryKey(workMapInput))?.isInvalidated).toBe(true);
  expect(queryClient.getQueryState(Api.companies.getFlatWorkMapQueryKey(reviewerWorkMapInput))?.isInvalidated).toBe(
    true,
  );
  jest.mocked(axios.get).mockClear();
  await visit();
  const workMapRequests = jest.mocked(axios.get).mock.calls.filter(([url]) => url.endsWith("/get_flat_work_map"));
  expect(workMapRequests).toHaveLength(2);
});
