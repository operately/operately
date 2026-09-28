/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@/__tests__/renderHook";
import { useProjectSearch } from ".";

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

it("preserves destination filters and returns canonical links", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { projects: [{ id: "project1", name: "Project" }] } });
  const hook = mount(
    () => useProjectSearch({ accessLevel: "edit_access", ignoredIds: ["current"], activeOnly: true }),
    undefined,
  );
  const options = await hook.result.current({ query: "plan" });

  expect(options[0]?.link).toBe("/company1/projects/project1");
  expect(jest.mocked(axios.get).mock.calls[0]?.[1]?.params).toEqual({
    query: "plan",
    access_level: "edit_access",
    ignored_ids: ["current"],
    active_only: true,
  });
});
