/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@/__tests__/renderHook";
import { useMentionedPersonSearch } from "./useMentionedPersonSearch";

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

it("preserves mention scope, trims terms, and combines exclusions", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { people: [{ id: "ada", full_name: "Ada" }] } });
  const hook = mount(
    () =>
      useMentionedPersonSearch({
        scope: { type: "goal", id: "goal1" },
        ignoredIds: ["one"],
        transformResult: (person) => person.fullName,
      }),
    undefined,
  );

  expect(await hook.result.current({ query: " Ada ", ignoredIds: ["two"] })).toEqual(["Ada"]);
  expect(jest.mocked(axios.get).mock.calls[0]?.[1]?.params).toEqual({
    query: "Ada",
    ignored_ids: ["one", "two"],
    search_scope_type: "goal",
    search_scope_id: "goal1",
  });
});
