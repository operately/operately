/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@/__tests__/renderHook";
import * as Lifecycle from "./companyLifecycle";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("turboui", () => ({}));

beforeEach(() => {
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
});

describe.each([
  {
    name: "useEditCompany",
    useRun: () => {
      const mutation = Lifecycle.useEditCompany();
      return () => mutation.mutateAsync({ name: "Renamed" });
    },
  },
  {
    name: "useAddCompanyTrustedEmailDomain",
    useRun: () => {
      const mutation = Lifecycle.useAddCompanyTrustedEmailDomain();
      return () => mutation.mutateAsync({ companyId: "company1", domain: "@example.com" });
    },
  },
  {
    name: "useRemoveCompanyTrustedEmailDomain",
    useRun: () => {
      const mutation = Lifecycle.useRemoveCompanyTrustedEmailDomain();
      return () => mutation.mutateAsync({ companyId: "company1", domain: "@example.com" });
    },
  },
  {
    name: "useDeleteCompany",
    useRun: () => {
      const mutation = Lifecycle.useDeleteCompany();
      return () => mutation.mutateAsync({});
    },
  },
])("$name", ({ useRun }) => {
  it("invalidates related cached inputs only after success", async () => {
    const client = new QueryClient();
    const related = [
      Api.companies.getQueryKey({}),
      Api.companies.getQueryKey({ includeOwners: true, includeAdmins: true }),
      Api.companies.listQueryKey({ includeMemberCount: true }),
    ];
    const unrelated = Api.notifications.listQueryKey({ page: 1 });
    [...related, unrelated].forEach((key) => client.setQueryData(key, {}));
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook((): (() => Promise<unknown>) => useRun(), {
      initialProps: undefined,
      wrapper,
    });
    try {
      jest.mocked(axios.post).mockRejectedValueOnce(new Error("Failed"));
      await act(async () => {
        await expect(result.current()).rejects.toThrow("Failed");
      });
      related.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
      jest.mocked(axios.post).mockResolvedValue({ data: {} });
      await act(async () => {
        await result.current();
      });
      related.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
      expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
    } finally {
      unmount();
      client.clear();
    }
  });
});
