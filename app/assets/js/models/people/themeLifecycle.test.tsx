/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { useGetTheme, useUpdateTheme } from "./themeLifecycle";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));

let client: QueryClient;
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
});
afterEach(() => client.clear());

it("loads the account theme into the generated query cache", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { theme: "dark" } });
  const { result } = renderHook(() => useGetTheme({}), { initialProps: undefined, wrapper });
  await waitFor(() => expect(result.current.data?.theme).toBe("dark"));
  expect(client.getQueryData(Api.getThemeQueryKey({}))).toEqual({ theme: "dark" });
});

it("synchronizes saved themes across company contexts without touching unrelated queries", async () => {
  const rootKey = Api.getThemeQueryKey({});
  client.setQueryData(rootKey, { theme: "dark" });
  Api.default.setHeaders({ "x-company-id": "company1" });
  const companyKey = Api.getThemeQueryKey({});
  client.setQueryData(companyKey, { theme: "dark" });
  const unrelatedKey = Api.people.getMeQueryKey({});
  client.setQueryData(unrelatedKey, { person: { id: "person1" } });
  jest.mocked(axios.post).mockResolvedValue({ data: { success: true } });
  const { result } = renderHook(useUpdateTheme, { initialProps: undefined, wrapper });

  await act(() => result.current.mutateAsync({ theme: "light" }));

  expect(axios.post).toHaveBeenCalledWith("/api/v2/people/update_theme", { theme: "light" }, expect.anything());
  expect(client.getQueryData(rootKey)).toEqual({ theme: "light" });
  expect(client.getQueryData(companyKey)).toEqual({ theme: "light" });
  expect(client.getQueryData(unrelatedKey)).toEqual({ person: { id: "person1" } });
  expect(client.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
});

it("preserves the saved cache when a mutation fails", async () => {
  const key = Api.getThemeQueryKey({});
  client.setQueryData(key, { theme: "dark" });
  jest.mocked(axios.post).mockRejectedValue(new Error("Failed"));
  const { result } = renderHook(useUpdateTheme, { initialProps: undefined, wrapper });
  await act(async () => {
    await expect(result.current.mutateAsync({ theme: "light" })).rejects.toThrow("Failed");
  });
  expect(client.getQueryData(key)).toEqual({ theme: "dark" });
});

it("prevents an older query response from overwriting a saved theme", async () => {
  let finishQuery = (_value: unknown) => {};
  jest.mocked(axios.get).mockImplementation(() => new Promise((resolve) => (finishQuery = resolve)));
  const { result } = renderHook(() => ({ query: useGetTheme({}), mutation: useUpdateTheme() }), {
    initialProps: undefined,
    wrapper,
  });
  jest.mocked(axios.post).mockResolvedValue({ data: { success: true } });
  await act(() => result.current.mutation.mutateAsync({ theme: "light" }));
  await act(async () => finishQuery({ data: { theme: "dark" } }));
  await waitFor(() => expect(result.current.query.data?.theme).toBe("light"));
});

it.each([false, true])("does not restore a cleared authentication cache (new session: %s)", async (newSession) => {
  const key = Api.getThemeQueryKey({});
  client.setQueryData(key, { theme: "dark" });
  let finishSave = (_value: unknown) => {};
  jest.mocked(axios.post).mockImplementation(() => new Promise((resolve) => (finishSave = resolve)));
  const { result } = renderHook(useUpdateTheme, { initialProps: undefined, wrapper });
  let saving: Promise<unknown>;
  await act(async () => {
    saving = result.current.mutateAsync({ theme: "light" });
  });
  await waitFor(() => expect(axios.post).toHaveBeenCalled());
  client.clear();
  if (newSession) client.setQueryData(key, { theme: "system" });
  await act(async () => {
    finishSave({ data: { success: true } });
    await saving;
  });
  expect(client.getQueryData(key)).toEqual(newSession ? { theme: "system" } : undefined);
});
