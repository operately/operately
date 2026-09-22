/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api, { type ProductRelease } from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { useProductRelease } from "./useProductRelease";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));

const release: ProductRelease = {
  __typename: "product_release",
  id: "https://operately.com/releases/v180",
  title: "Release notes",
  publishedAt: "2026-07-17T00:00:00Z",
};

let client: QueryClient;
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
const mount = () => renderHook(useProductRelease, { initialProps: undefined, wrapper });
const queryKey = () => Api.product_releases.getLatestQueryKey({});

beforeEach(() => {
  jest.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
});
afterEach(() => client.clear());

it("returns null while loading, then caches the latest release", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { product_release: release } });
  const { result } = mount();
  expect(result.current).toBeNull();
  await waitFor(() => expect(result.current).toEqual(release));
  expect(client.getQueryData(queryKey())).toEqual({ productRelease: release });
});

it.each([{}, { product_release: null }])("returns null when release information is absent (%j)", async (data) => {
  jest.mocked(axios.get).mockResolvedValue({ data });
  const { result } = mount();
  await waitFor(() => expect(client.getQueryState(queryKey())?.status).toBe("success"));
  expect(result.current).toBeNull();
});

it("treats an initial query failure as unavailable release information and can recover", async () => {
  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  const { result } = mount();
  await waitFor(() => expect(client.getQueryState(queryKey())?.status).toBe("error"));
  expect(result.current).toBeNull();

  jest.mocked(axios.get).mockResolvedValue({ data: { product_release: release } });
  await act(() => client.invalidateQueries({ queryKey: queryKey() }));
  await waitFor(() => expect(result.current).toEqual(release));
});

it("reuses cached release data immediately on remount while refreshing in the background", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { product_release: release } });
  const first = mount();
  await waitFor(() => expect(first.result.current).toEqual(release));
  first.unmount();

  let finish = (_value: unknown) => {};
  jest.mocked(axios.get).mockImplementation(() => new Promise((resolve) => (finish = resolve)));
  const second = mount();
  expect(second.result.current).toEqual(release);
  const latest = { ...release, id: "https://operately.com/releases/v190" };
  await act(async () => finish({ data: { product_release: latest } }));
  await waitFor(() => expect(second.result.current).toEqual(latest));
});

it("retains the last successful release when a background refresh fails", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { product_release: release } });
  const { result } = mount();
  await waitFor(() => expect(result.current).toEqual(release));

  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  await act(() => client.invalidateQueries({ queryKey: queryKey() }));
  await waitFor(() => expect(client.getQueryState(queryKey())?.status).toBe("error"));
  expect(result.current).toEqual(release);
});

it("removes the release when a subsequent successful response has no release", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { product_release: release } });
  const { result } = mount();
  await waitFor(() => expect(result.current).toEqual(release));

  jest.mocked(axios.get).mockResolvedValue({ data: { product_release: null } });
  await act(() => client.invalidateQueries({ queryKey: queryKey() }));
  await waitFor(() => expect(result.current).toBeNull());
});
