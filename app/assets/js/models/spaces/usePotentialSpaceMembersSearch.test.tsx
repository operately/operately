/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@/__tests__/renderHook";
import { usePotentialSpaceMembersSearch } from "./usePotentialSpaceMembersSearch";

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

it("loads potential members with the current space and query", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { people: [{ id: "ada" }] } });
  const hook = mount(usePotentialSpaceMembersSearch, "space1");

  expect(await hook.result.current("Ada")).toEqual([{ id: "ada" }]);

  jest.mocked(axios.get).mockResolvedValueOnce({ data: { people: [] } });

  expect(await hook.result.current("Ada")).toEqual([{ id: "ada" }]);

  hook.rerender("space2");

  expect(await hook.result.current("Ada")).toEqual([]);
  expect(jest.mocked(axios.get).mock.calls.at(-1)?.[1]?.params).toEqual({ space_id: "space2", query: "Ada" });
  expect(axios.get).toHaveBeenCalledTimes(2);
});
