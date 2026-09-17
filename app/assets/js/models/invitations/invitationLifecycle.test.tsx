/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@/__tests__/renderHook";
import { companyInviteLinkQueryOptions } from "./invitationQueries";
import {
  useResetCompanyInviteLink,
  useUpdateCompanyInviteLink,
  useJoinCompany,
  useJoinCompanyViaInviteLink,
} from "./invitationLifecycle";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company" });
});
afterEach(() => queryClient.clear());

describe.each([
  {
    name: "update",
    useRun: () => {
      const mutation = useUpdateCompanyInviteLink();
      return () => mutation.mutateAsync({ isActive: false });
    },
  },
  {
    name: "reset",
    useRun: () => {
      const mutation = useResetCompanyInviteLink();
      return () => mutation.mutateAsync({});
    },
  },
])("$name company invite link", ({ useRun }) => {
  it("updates the cached link and invalidates related queries only after success", async () => {
    const companyKey = companyInviteLinkQueryOptions({}).queryKey;
    const related = [
      companyKey,
      Api.invitations.getInviteLinkAvailabilityQueryKey({ token: "old" }),
      Api.invitations.getInviteLinkAvailabilityQueryKey({ token: "new" }),
      Api.invitations.getInviteLinkByTokenQueryKey({ token: "old" }),
    ];
    const unrelated = Api.spaces.listQueryKey({});
    [...related, unrelated].forEach((key) => queryClient.setQueryData(key, {}));
    const { result } = renderHook(() => useRun(), { initialProps: undefined, wrapper });
    jest.mocked(axios.post).mockRejectedValueOnce(new Error("Failed"));
    await act(async () => {
      await expect(result.current()).rejects.toThrow("Failed");
    });
    related.forEach((key) => expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false));

    const inviteLink = { token: "new", isActive: false, allowedDomains: ["example.com"] };
    jest.mocked(axios.post).mockResolvedValue({ data: { inviteLink } });
    await act(async () => {
      await result.current();
    });
    expect(queryClient.getQueryData(companyKey)).toEqual({ inviteLink });
    related.forEach((key) => expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true));
    expect(queryClient.getQueryState(unrelated)?.isInvalidated).toBe(false);
  });
});

it("joins with a personal invitation through a TanStack mutation", async () => {
  const { result } = renderHook(useJoinCompany, { initialProps: undefined, wrapper });
  jest.mocked(axios.post).mockResolvedValue({ data: { result: "success" } });
  await act(async () => {
    await result.current.mutateAsync({ token: "personal", password: "password", passwordConfirmation: "password" });
  });
  expect(axios.post).toHaveBeenCalledWith(
    "/api/v2/join_company",
    {
      token: "personal",
      password: "password",
      password_confirmation: "password",
    },
    expect.anything(),
  );
});

it("preserves a failed company-link join error so the page can handle member limits", async () => {
  const error = { status: 403, message: "member_count_limit_exceeded" };
  jest.mocked(axios.post).mockRejectedValue(error);
  const { result } = renderHook(useJoinCompanyViaInviteLink, { initialProps: undefined, wrapper });
  await act(async () => {
    await expect(result.current.mutateAsync({ token: "company-link" })).rejects.toBe(error);
  });
});
