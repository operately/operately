/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@/__tests__/renderHook";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
});
afterEach(() => queryClient.clear());
import * as Lifecycle from "./accountAccessLifecycle";

describe.each([
  {
    name: "CreateApiToken",
    key: () => Api.api_tokens.listQueryKey({}),
    useRun: () => {
      const mutation = Lifecycle.useCreateApiToken();
      return () => mutation.mutateAsync({ readOnly: true });
    },
  },
  {
    name: "DeleteApiToken",
    key: () => Api.api_tokens.listQueryKey({}),
    useRun: () => {
      const mutation = Lifecycle.useDeleteApiToken();
      return () => mutation.mutateAsync({ id: "token" });
    },
  },
  {
    name: "SetApiTokenReadOnly",
    key: () => Api.api_tokens.listQueryKey({}),
    useRun: () => {
      const mutation = Lifecycle.useSetApiTokenReadOnly();
      return () => mutation.mutateAsync({ id: "token", readOnly: false });
    },
  },
  {
    name: "UpdateApiTokenName",
    key: () => Api.api_tokens.listQueryKey({}),
    useRun: () => {
      const mutation = Lifecycle.useUpdateApiTokenName();
      return () => mutation.mutateAsync({ id: "token", name: "Renamed" });
    },
  },
  {
    name: "RevokeMcpGrant",
    key: () => Api.mcp_grants.listQueryKey({}),
    useRun: () => {
      const mutation = Lifecycle.useRevokeMcpGrant();
      return () => mutation.mutateAsync({ id: "grant" });
    },
  },
])("$name", ({ key, useRun }) => {
  it("invalidates account lists in every company only after success", async () => {
    const first = key();
    Api.default.setHeaders({ "x-company-id": "second" });
    const second = key();
    const unrelated = Api.spaces.listQueryKey({});
    [first, second, unrelated].forEach((key) => queryClient.setQueryData(key, {}));
    const { result } = renderHook(() => useRun(), { initialProps: undefined, wrapper });
    jest.mocked(axios.post).mockRejectedValueOnce(new Error("Failed"));
    await act(async () => {
      await expect(result.current()).rejects.toThrow("Failed");
    });
    [first, second].forEach((key) => expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false));
    jest.mocked(axios.post).mockResolvedValue({ data: {} });
    await act(async () => {
      await result.current();
    });
    [first, second].forEach((key) => expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true));
    expect(queryClient.getQueryState(unrelated)?.isInvalidated).toBe(false);
  });
});
