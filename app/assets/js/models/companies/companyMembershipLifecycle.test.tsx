/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@/__tests__/renderHook";
import * as Lifecycle from "./companyMembershipLifecycle";

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
    name: "useAddCompanyAdmins",
    useRun: () => {
      const mutation = Lifecycle.useAddCompanyAdmins();
      return () => mutation.mutateAsync({ peopleIds: ["person1"] });
    },
  },
  {
    name: "useAddCompanyOwners",
    useRun: () => {
      const mutation = Lifecycle.useAddCompanyOwners();
      return () => mutation.mutateAsync({ peopleIds: ["person1"] });
    },
  },
  {
    name: "useRemoveCompanyAdmin",
    useRun: () => {
      const mutation = Lifecycle.useRemoveCompanyAdmin();
      return () => mutation.mutateAsync({ personId: "person1" });
    },
  },
  {
    name: "useRemoveCompanyOwner",
    useRun: () => {
      const mutation = Lifecycle.useRemoveCompanyOwner();
      return () => mutation.mutateAsync({ personId: "person1" });
    },
  },
  {
    name: "useAddCompanyMember",
    useRun: () => {
      const mutation = Lifecycle.useAddCompanyMember();
      return () => mutation.mutateAsync({ fullName: "Person", email: "person@example.com", title: "Engineer" });
    },
  },
  {
    name: "useRemoveCompanyMember",
    useRun: () => {
      const mutation = Lifecycle.useRemoveCompanyMember();
      return () => mutation.mutateAsync({ personId: "person1" });
    },
  },
  {
    name: "useRestoreCompanyMember",
    useRun: () => {
      const mutation = Lifecycle.useRestoreCompanyMember();
      return () => mutation.mutateAsync({ personId: "person1" });
    },
  },
  {
    name: "useInviteGuest",
    useRun: () => {
      const mutation = Lifecycle.useInviteGuest();
      return () => mutation.mutateAsync({ fullName: "Person", email: "guest@example.com", title: "Engineer" });
    },
  },
  {
    name: "useConvertMemberToGuest",
    useRun: () => {
      const mutation = Lifecycle.useConvertMemberToGuest();
      return () => mutation.mutateAsync({ personId: "person1" });
    },
  },
  {
    name: "useUpdateMembersPermissions",
    useRun: () => {
      const mutation = Lifecycle.useUpdateMembersPermissions();
      return () => mutation.mutateAsync({ members: [{ id: "person1", accessLevel: "view_access" }] });
    },
  },
  {
    name: "useNewInvitationToken",
    useRun: () => {
      const mutation = Lifecycle.useNewInvitationToken();
      return () => mutation.mutateAsync({ personId: "person1" });
    },
  },
])("$name", ({ useRun }) => {
  it("invalidates related cached inputs only after success", async () => {
    const client = new QueryClient();
    const related = [
      Api.companies.getQueryKey({}),
      Api.companies.getQueryKey({ includeOwners: true, includeAdmins: true }),
      Api.companies.listQueryKey({ includeMemberCount: true }),
      Api.people.listQueryKey({}),
      Api.people.listQueryKey({ onlySuspended: true }),
      Api.people.getQueryKey({ id: "person1" }),
      Api.people.getMeQueryKey({}),
    ];
    const unrelated = Api.notifications.listQueryKey({ page: 1 });
    [...related, unrelated].forEach((key) => client.setQueryData(key, {}));
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook(useRun, { initialProps: undefined, wrapper });
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
