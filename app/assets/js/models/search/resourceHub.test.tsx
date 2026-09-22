/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@/__tests__/renderHook";
import { useResourceHubSearchProps } from "./resourceHub";

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

it("searches the selected hub and does not offer search without one", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { nodes: [{ id: "doc1" }] } });
  const hook = mount(
    (id: string | undefined) => ({ props: useResourceHubSearchProps(id) }),
    "hub1" as string | undefined,
  );

  expect(await hook.result.current.props?.search({ query: "plan" })).toEqual([{ id: "doc1" }]);
  expect(jest.mocked(axios.get).mock.calls[0]?.[1]?.params).toEqual({ resource_hub_id: "hub1", query: "plan" });

  hook.rerender(undefined);

  expect(hook.result.current.props).toBeUndefined();
  expect(axios.get).toHaveBeenCalledTimes(1);
});
