/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Pages from "@/components/Pages";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { loader, useLoadedData } from "./loader";
import { invalidateSpaceSummaryQueries } from "@/models/spaces/spaceSummaryQueries";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));

const space = { id: "space1", members: [], permissions: { canEdit: true }, name: "Space" };
const response = { space, tools: { tasks: [] } };

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
  jest.mocked(axios.get).mockResolvedValue({ data: response });
});

afterEach(() => queryClient.clear());

async function visit() {
  const inputs = await loader({ params: { id: "space1" } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);

  return inputs;
}

it("prefetches both queries in parallel and reuses cached data on mount and route re-entry", async () => {
  const finish: ((value: unknown) => void)[] = [];
  jest.mocked(axios.get).mockImplementation(() => new Promise((resolve) => finish.push(resolve)));

  const loading = visit();
  await waitFor(() => expect(finish).toHaveLength(2));

  finish.forEach((resolve) => resolve({ data: response }));

  const inputs = await loading;
  expect(inputs).not.toHaveProperty("space");

  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });

  expect(result.current.space.name).toBe("Space");

  await visit();
  expect(axios.get).toHaveBeenCalledTimes(2);
});

it("subscribes to summary invalidation and retains cached data on refresh failure", async () => {
  await visit();
  const { result, rerender } = renderHook(useLoadedData, { initialProps: undefined, wrapper });

  jest.mocked(axios.get).mockResolvedValue({ data: { tools: { tasks: [{ id: "task1" }] } } });
  await act(() => invalidateSpaceSummaryQueries(queryClient, ["old-space1"]));
  await waitFor(() => expect(result.current.tools.tasks).toEqual([{ id: "task1" }]));

  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  await act(() => queryClient.invalidateQueries());
  rerender(undefined);

  expect(result.current.space.name).toBe("Space");
  expect(result.current.tools.tasks).toEqual([{ id: "task1" }]);
});

it.each([
  [{ tools: {} }, /Space data/],
  [{ space }, /Space tools/],
  [{ space: { ...space, members: null }, tools: {} }, /Space members/],
  [{ space: { ...space, permissions: null }, tools: {} }, /Space permissions/],
])("guards missing required data (%#)", async (data, error) => {
  jest.mocked(axios.get).mockResolvedValue({ data });

  await visit();

  const log = jest.spyOn(console, "error").mockImplementation(() => {});

  try {
    expect(() => renderHook(useLoadedData, { initialProps: undefined, wrapper })).toThrow(error);
  } finally {
    log.mockRestore();
  }
});

jest.mock("react-router", () => ({}));
