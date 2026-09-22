/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@/__tests__/renderHook";
import { useParentGoalSearch } from "./useParentGoalSearch";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("react-router", () => ({}));
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/routes/paths", () => {
  const actual = jest.requireActual("@/routes/paths");
  const paths = new actual.Paths({ companyId: "company1" });

  return { ...actual, usePaths: () => paths };
});

let client: QueryClient;

beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
});

afterEach(() => client.clear());

function mount<Props, Result>(hook: (props: Props) => Result, initialProps: Props) {
  return renderHook(hook, {
    initialProps,
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}

it.each(["goal", "project"] as const)("uses the %s parent-goal endpoint and maps links", async (type) => {
  jest.mocked(axios.get).mockResolvedValue({ data: { goals: [{ id: "goal1", name: "Parent" }] } });
  const hook = mount(() => useParentGoalSearch({ type, id: "child1" }), undefined);

  expect(await hook.result.current({ query: " Parent " })).toEqual([
    { id: "goal1", name: "Parent", link: "/company1/goals/goal1" },
  ]);
  expect(jest.mocked(axios.get).mock.calls[0]?.[0]).toBe(`/api/v2/${type}s/search_parent_goal`);
  expect(jest.mocked(axios.get).mock.calls[0]?.[1]?.params).toEqual({ [type + "_id"]: "child1", query: "Parent" });
});
