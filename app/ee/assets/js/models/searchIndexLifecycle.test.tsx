/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import * as AdminApi from "@/ee/admin_api";
import { queryClient, useLoadedQuery } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";

jest.mock("axios");
jest.mock("@/ee/admin_api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
beforeEach(() => {
  queryClient.clear();
  jest.resetAllMocks();
  AdminApi.default.default.setBasePath("/admin/api");
});
afterEach(() => queryClient.clear());
import { useRefreshSearchIndex, useStartSearchIndexMaintenance } from "./searchIndexLifecycle";
import { scheduleActiveRunRefresh, startMaintenanceAndRefresh } from "@/ee/pages/SaasAdminSearchIndexPage";
jest.mock("turboui", () => ({ showSuccessToast: jest.fn() }));
jest.mock("@/components/Pages", () => ({}));

it("refreshes observed status after starting maintenance", async () => {
  const options = AdminApi.getSearchIndexStatusQueryOptions({});
  queryClient.setQueryData(AdminApi.getSearchIndexStatusQueryKey({}), { sources: [] });
  jest
    .mocked(axios.post)
    .mockResolvedValue({ data: { startedSourceTypes: ["project"], alreadyRunningSourceTypes: [] } });
  jest
    .mocked(axios.get)
    .mockResolvedValue({ data: { sources: [{ sourceType: "project", latestRun: { status: "pending" } }] } });
  const { result } = renderHook(
    () => ({
      mutation: useStartSearchIndexMaintenance(),
      query: useLoadedQuery(options),
      refresh: useRefreshSearchIndex(),
    }),
    { initialProps: undefined, wrapper },
  );
  await act(async () => {
    await startMaintenanceAndRefresh(
      result.current.mutation.mutateAsync,
      result.current.refresh,
      "backfill",
      "project",
    );
  });
  await waitFor(() => expect(result.current.query.data?.sources[0]?.latestRun?.status).toBe("pending"));
  expect(axios.get).toHaveBeenCalledTimes(1);
});

it("polls live query data every five seconds and stops after the run completes", async () => {
  jest.useFakeTimers();
  try {
    const options = AdminApi.getSearchIndexStatusQueryOptions({});
    queryClient.setQueryData(AdminApi.getSearchIndexStatusQueryKey({}), {
      sources: [{ sourceType: "project", latestRun: { status: "running" } }],
    });
    jest
      .mocked(axios.get)
      .mockResolvedValue({ data: { sources: [{ sourceType: "project", latestRun: { status: "completed" } }] } });
    const { result } = renderHook(
      () => {
        const query = useLoadedQuery(options);
        const refresh = useRefreshSearchIndex();
        const sources = query.data?.sources ?? [];
        React.useEffect(() => scheduleActiveRunRefresh(sources, refresh), [sources, refresh]);
        return query;
      },
      { initialProps: undefined, wrapper },
    );
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5001);
    });
    expect(result.current.data?.sources[0]?.latestRun?.status).toBe("completed");
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10000);
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
  } finally {
    jest.useRealTimers();
  }
});

jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: jest.fn() }));
