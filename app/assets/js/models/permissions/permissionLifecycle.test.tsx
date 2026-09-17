/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@/__tests__/renderHook";
import { useGrantResourceAccess } from "./permissionLifecycle";

jest.mock("axios");
jest.mock("react-router", () => ({}));
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("turboui", () => ({}));

it.each(["space", "goal", "project"] as const)(
  "refreshes cached access after granting a collaborator access to a %s",
  async (resourceType) => {
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company1" });
    const client = new QueryClient();
    const resourceKeys = {
      space: Api.spaces.getQueryKey({ id: "resource1", includeMembersAccessLevels: true }),
      goal: Api.goals.listAccessMembersQueryKey({ goalId: "resource1" }),
      project: Api.projects.getQueryKey({ id: "resource1", includeContributors: true }),
    };
    const related = [
      resourceKeys[resourceType],
      Api.companies.getWorkMapQueryKey({}),
      Api.companies.getFlatWorkMapQueryKey({}),
    ];
    const unrelated = Api.notifications.listQueryKey({});
    [...related, unrelated].forEach((key) => client.setQueryData(key, {}));
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook(useGrantResourceAccess, { initialProps: undefined, wrapper });
    const input = {
      personId: "person1",
      resources: [{ resourceType, resourceId: "resource1", accessLevel: "view_access" as const }],
    };
    try {
      jest.mocked(axios.post).mockRejectedValueOnce(new Error("Failed"));
      await act(async () => {
        await expect(result.current.mutateAsync(input)).rejects.toThrow("Failed");
      });
      related.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
      jest.mocked(axios.post).mockResolvedValue({ data: { success: true } });
      await act(async () => {
        await result.current.mutateAsync(input);
      });
      related.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
      expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
    } finally {
      unmount();
      client.clear();
    }
  },
);
