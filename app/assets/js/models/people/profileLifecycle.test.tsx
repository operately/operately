/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@/__tests__/renderHook";
import { useUpdateProfile, useUpdateProfilePicture } from "./profileLifecycle";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
});

describe.each([
  {
    name: "profile",
    useUpdate: () => {
      const mutation = useUpdateProfile();
      return () => mutation.mutateAsync({ id: "person1", fullName: "Updated", managerId: "manager2" });
    },
    endpoint: "/people/update",
    payload: { id: "person1", full_name: "Updated", manager_id: "manager2" },
  },
  ...["/avatar.png", null].map((avatarUrl) => ({
    name: avatarUrl ? "avatar upload" : "avatar removal",
    useUpdate: () => {
      const mutation = useUpdateProfilePicture();
      return () => mutation.mutateAsync({ personId: "person1", avatarBlobId: avatarUrl ? "blob1" : null, avatarUrl });
    },
    endpoint: "/people/update_picture",
    payload: { person_id: "person1", avatar_blob_id: avatarUrl ? "blob1" : null, avatar_url: avatarUrl },
  })),
])("$name", ({ useUpdate, endpoint, payload }) => {
  it("invalidates related people and work-map queries only after success", async () => {
    const client = new QueryClient();
    const related = [
      Api.people.getQueryKey({ id: "person1" }),
      Api.people.getQueryKey({ id: "manager1", includeReports: true }),
      Api.people.getQueryKey({ id: "manager2", includePeers: true }),
      Api.people.listQueryKey({ includeManager: true }),
      Api.people.listQueryKey({ includeSuspended: true }),
      Api.people.getMeQueryKey({ includeManager: true }),
      Api.companies.getQueryKey({ includeAdmins: true, includeOwners: true }),
      Api.companies.getFlatWorkMapQueryKey({ championId: "person1" }),
      Api.companies.getFlatWorkMapQueryKey({ reviewerId: "person1" }),
      Api.companies.getWorkMapQueryKey({}),
      Api.companies.getWorkMapQueryKey({ spaceId: "space1" }),
    ];
    const unrelated = [Api.spaces.getQueryKey({ id: "space1" })];
    [...related, ...unrelated].forEach((key) => client.setQueryData(key, {}));
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook(useUpdate, { initialProps: undefined, wrapper });
    try {
      jest.mocked(axios.post).mockRejectedValueOnce(new Error("Failed"));
      await act(async () => {
        await expect(result.current()).rejects.toThrow("Failed");
      });
      related.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
      jest.mocked(axios.post).mockResolvedValue({ data: { person: { id: "person1" } } });
      await act(async () => {
        await result.current();
      });
      related.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
      unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
      expect(axios.post).toHaveBeenLastCalledWith(expect.stringContaining(endpoint), payload, expect.anything());
    } finally {
      unmount();
      client.clear();
    }
  });
});
