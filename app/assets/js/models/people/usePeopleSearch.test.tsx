/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@/__tests__/renderHook";
import { usePeopleSearch } from ".";

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

it("accepts both callback formats and skips requests when search is disabled", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { people: [{ id: "ada" }] } });
  const hook = mount(() => usePeopleSearch({ type: "company" }), undefined);

  expect(await hook.result.current("Ada")).toEqual([{ id: "ada" }]);

  await hook.result.current({ query: "Ada", ignoredIds: ["ignored"] });

  expect(jest.mocked(axios.get).mock.calls.at(-1)?.[1]?.params).toEqual({
    query: "Ada",
    ignored_ids: ["ignored"],
    search_scope_type: "company",
  });

  const disabled = mount(() => usePeopleSearch({ type: "none" }), undefined);

  expect(await disabled.result.current("Ada")).toEqual([]);
  expect(axios.get).toHaveBeenCalledTimes(2);
});
