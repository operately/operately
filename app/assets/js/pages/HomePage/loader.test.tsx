/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Pages from "@/components/Pages";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { loader, useLoadedData } from "./loader";

jest.mock("axios");
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));

const response = {
  company: { id: "company1", name: "Company", setupCompleted: true, owners: [], admins: [] },
  spaces: [],
};
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  jest.mocked(axios.get).mockResolvedValue({ data: response });
});
afterEach(() => queryClient.clear());

it("reuses prefetched data on mount and route re-entry", async () => {
  const inputs = await loader();
  expect(inputs).not.toHaveProperty("company");
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result, unmount } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.company).toEqual(response.company);
  unmount();
  await loader();
  renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(axios.get).toHaveBeenCalledTimes(2);
});

it("refreshes mounted data after invalidation", async () => {
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader());
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  const updated = { ...response.company, name: "Renamed" };
  jest.mocked(axios.get).mockResolvedValue({ data: { ...response, company: updated } });
  await act(() => queryClient.invalidateQueries({ queryKey: Api.companies.getQueryKeyPrefix() }));
  await waitFor(() => expect(result.current.company).toEqual(updated));
});

it.each([{ workMap: [] }, { workMap: [{ id: "project1" }] }])(
  "loads work items during company setup: $workMap",
  async ({ workMap }) => {
    jest
      .mocked(axios.get)
      .mockResolvedValue({ data: { ...response, company: { ...response.company, setupCompleted: false }, workMap } });
    jest.mocked(Pages.useLoadedData).mockReturnValue(await loader());
    const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
    expect(result.current.hasWorkItems).toBe(workMap.length > 0);
    expect(axios.get).toHaveBeenCalledTimes(3);
  },
);

it("does not load work items for a company that has completed setup", async () => {
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader());
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.hasWorkItems).toBe(false);
  expect(axios.get).not.toHaveBeenCalledWith(expect.stringContaining("get_work_map"), expect.anything());
});
