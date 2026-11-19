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

it("defaults to no announcement while loading, then caches the release and eligibility", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { product_release: release, can_announce: true } });
  const { result } = mount();
  expect(result.current).toEqual({ productRelease: null, canAnnounce: false });
  await waitFor(() => expect(result.current).toEqual({ productRelease: release, canAnnounce: true }));
  expect(client.getQueryData(queryKey())).toEqual({ productRelease: release, canAnnounce: true });
});

it.each([{}, { product_release: null }])(
  "returns no release or announcement when release information is absent (%j)",
  async (data) => {
    jest.mocked(axios.get).mockResolvedValue({ data });
    const { result } = mount();
    await waitFor(() => expect(client.getQueryState(queryKey())?.status).toBe("success"));
    expect(result.current).toEqual({ productRelease: null, canAnnounce: false });
  },
);

it.each([{}, { can_announce: false }])("retains the release without eligibility (%j)", async (eligibility) => {
  jest.mocked(axios.get).mockResolvedValue({ data: { product_release: release, ...eligibility } });
  const { result } = mount();
  await waitFor(() => expect(result.current).toEqual({ productRelease: release, canAnnounce: false }));
});

it("treats an initial query failure as unavailable release information and can recover", async () => {
  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  const { result } = mount();
  await waitFor(() => expect(client.getQueryState(queryKey())?.status).toBe("error"));
  expect(result.current).toEqual({ productRelease: null, canAnnounce: false });

  jest.mocked(axios.get).mockResolvedValue({ data: { product_release: release } });
  await act(() => client.invalidateQueries({ queryKey: queryKey() }));
  await waitFor(() => expect(result.current).toEqual({ productRelease: release, canAnnounce: false }));
});

it("reuses cached release data immediately on remount while refreshing in the background", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { product_release: release, can_announce: true } });
  const first = mount();
  await waitFor(() => expect(first.result.current).toEqual({ productRelease: release, canAnnounce: true }));
  first.unmount();

  let finish = (_value: unknown) => {};
  jest.mocked(axios.get).mockImplementation(() => new Promise((resolve) => (finish = resolve)));
  const second = mount();
  expect(second.result.current).toEqual({ productRelease: release, canAnnounce: true });
  const latest = { ...release, id: "https://operately.com/releases/v190" };
  await act(async () => finish({ data: { product_release: latest, can_announce: true } }));
  await waitFor(() => expect(second.result.current).toEqual({ productRelease: latest, canAnnounce: true }));
});

it("retains the last successful release when a background refresh fails", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { product_release: release, can_announce: true } });
  const { result } = mount();
  await waitFor(() => expect(result.current).toEqual({ productRelease: release, canAnnounce: true }));

  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  await act(() => client.invalidateQueries({ queryKey: queryKey() }));
  await waitFor(() => expect(client.getQueryState(queryKey())?.status).toBe("error"));
  expect(result.current).toEqual({ productRelease: release, canAnnounce: true });
});

it("removes the release when a subsequent successful response has no release", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { product_release: release, can_announce: true } });
  const { result } = mount();
  await waitFor(() => expect(result.current).toEqual({ productRelease: release, canAnnounce: true }));

  jest.mocked(axios.get).mockResolvedValue({ data: { product_release: null } });
  await act(() => client.invalidateQueries({ queryKey: queryKey() }));
  await waitFor(() => expect(result.current).toEqual({ productRelease: null, canAnnounce: false }));
});
