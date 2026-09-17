/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import * as Signals from "@/signals";
import { useAssignmentsCount } from "./useAssignmentsCount";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("@/signals", () => ({
  useAssignmentsCount: jest.fn(),
  useUnreadNotificationCount: jest.fn(),
  useNotificationRefreshSignal: jest.fn(),
}));

it.each(["server", "local"])(
  "refreshes the count and invalidates the inactive page list on a %s signal",
  async (source) => {
    jest.clearAllMocks();
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company1" });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const listKey = Api.people.listAssignmentsQueryKey({});
    const unrelated = Api.spaces.listQueryKey({});
    client.setQueryData(listKey, {});
    client.setQueryData(unrelated, {});
    jest.mocked(axios.get).mockResolvedValue({ data: { count: 2 } });
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook(useAssignmentsCount, { initialProps: undefined, wrapper });
    try {
      await waitFor(() => expect(result.current[0]).toBe(2));
      jest.mocked(axios.get).mockResolvedValue({ data: { count: 3 } });
      const callback =
        source === "server" ? jest.mocked(Signals.useAssignmentsCount).mock.calls.at(-1)?.[0] : result.current[1];
      if (!callback) throw new Error("Refresh callback is unavailable");
      act(() => callback());
      await waitFor(() => expect(result.current[0]).toBe(3));
      expect(client.getQueryState(listKey)?.isInvalidated).toBe(true);
      expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
    } finally {
      unmount();
      client.clear();
    }
  },
);
