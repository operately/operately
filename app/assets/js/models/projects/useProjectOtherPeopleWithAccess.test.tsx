/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api from "@/api";
import { useProjectOtherPeopleWithAccess } from "./useProjectOtherPeopleWithAccess";

jest.mock("@/routes/paths", () => ({ compareIds: (a: string, b: string) => a === b }));
jest.mock("turboui", () => ({}));

const key = (id: string) => Api.people.getBindedQueryKey({ resourseType: "project", resourseId: id });
const person = (id: string) => ({ id, fullName: id, avatarUrl: null, accessLevel: 70 });
let client: QueryClient;
let request: jest.Mock;

beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  request = jest.fn().mockResolvedValue({ people: [person("one"), person("two")] });
  const original = Api.people.getBindedQueryOptions;
  jest.spyOn(Api.people, "getBindedQueryOptions").mockImplementation((input) => ({
    ...original(input),
    queryFn: () => request(input),
  }));
});

afterEach(() => {
  client.clear();
  jest.restoreAllMocks();
});

function setup() {
  return renderHook(useProjectOtherPeopleWithAccess, {
    initialProps: { projectId: "p1", assignedPersonIds: ["one"] },
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}

it("loads on request, updates role filtering, and stays subscribed to invalidation", async () => {
  const { result, rerender } = setup();
  expect(request).not.toHaveBeenCalled();
  expect(result.current.people).toBeUndefined();
  act(() => result.current.onRequestLoad());
  await waitFor(() => expect(result.current.people?.map((p) => p.id)).toEqual(["two"]));
  rerender({ projectId: "p1", assignedPersonIds: ["two"] });
  expect(result.current.people?.map((p) => p.id)).toEqual(["one"]);
  expect(request).toHaveBeenCalledTimes(1);
  await act(() => client.invalidateQueries({ queryKey: key("p1") }));
  expect(request).toHaveBeenCalledTimes(2);
});

it("keeps cached people visible during a failed background refresh and allows retry", async () => {
  client.setQueryData(key("p1"), { people: [person("cached")] });
  request.mockRejectedValueOnce(new Error("offline"));
  const { result } = setup();
  act(() => result.current.onRequestLoad());
  await waitFor(() => expect(client.getQueryState(key("p1"))?.status).toBe("error"));
  expect(result.current.people?.map((p) => p.id)).toEqual(["cached"]);
  act(() => result.current.onRequestLoad());
  await waitFor(() => expect(result.current.people?.map((p) => p.id)).toEqual(["two"]));
});

it("retries an initial failure and returns an empty successful list", async () => {
  request.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ people: [] });
  const { result } = setup();
  act(() => result.current.onRequestLoad());
  await waitFor(() => expect(client.getQueryState(key("p1"))?.status).toBe("error"));
  expect(result.current.people).toEqual([]);
  act(() => result.current.onRequestLoad());
  await waitFor(() => expect(client.getQueryState(key("p1"))?.status).toBe("success"));
  expect(result.current.people).toEqual([]);
});

it("does not show a previous project's late response", async () => {
  let finish: (value: unknown) => void = () => {};
  request.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const { result, rerender } = setup();
  act(() => result.current.onRequestLoad());
  rerender({ projectId: "p2", assignedPersonIds: [] });
  expect(result.current.people).toBeUndefined();
  await act(async () => finish({ people: [person("old")] }));
  expect(result.current.people).toBeUndefined();
  act(() => result.current.onRequestLoad());
  await waitFor(() => expect(result.current.people?.map((p) => p.id)).toEqual(["one", "two"]));
});
