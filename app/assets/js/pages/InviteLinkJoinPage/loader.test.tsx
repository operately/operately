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
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("react-router", () => ({ redirect: (url: string) => ({ status: 302, headers: { get: () => url } }) }));
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({
  useLoadedData: jest.fn(),
  getSearchParam: (request: { url: string }, name: string) => new URL(request.url).searchParams.get(name),
}));

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
});
afterEach(() => queryClient.clear());

const args = { params: { token: "company-link" } };
const inviteLink = { token: "company-link", isActive: true };

beforeEach(() => {
  window.appConfig = { account: null } as unknown as typeof window.appConfig;
  jest.mocked(axios.get).mockResolvedValue({ data: { inviteLink, memberLimitExceeded: false } });
});

it.each([false, true])("derives the invitation state for loggedIn=%s and observes link changes", async (loggedIn) => {
  if (loggedIn) window.appConfig.account = { id: 1 };
  const inputs = await loader(args);
  expect(inputs).toEqual({ queryInput: { token: "company-link" } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.pageState).toBe(loggedIn ? "logged-in-user-valid-token" : "anonymous-user-valid-token");
  expect(axios.get).toHaveBeenCalledTimes(1);
  jest
    .mocked(axios.get)
    .mockResolvedValue({ data: { inviteLink: { ...inviteLink, isActive: false }, memberLimitExceeded: false } });
  await act(() =>
    queryClient.invalidateQueries({ queryKey: Api.invitations.getInviteLinkAvailabilityQueryKeyPrefix() }),
  );
  await waitFor(() => expect(result.current.pageState).toBe("invalid-token"));
});

it("checks capacity again when retrying a previously full company", async () => {
  jest.mocked(axios.get).mockResolvedValueOnce({ data: { inviteLink, memberLimitExceeded: true } });
  const full = await loader(args);
  expect(full).toMatchObject({ status: 302 });
  if ("headers" in full) expect(full.headers.get("Location")).toBe("/join/company-link/full");
  expect(await loader(args)).toEqual({ queryInput: { token: "company-link" } });
  expect(axios.get).toHaveBeenCalledTimes(2);
});

it("shows an invalid token instead of redirecting an inactive link to the full page", async () => {
  jest
    .mocked(axios.get)
    .mockResolvedValue({ data: { inviteLink: { ...inviteLink, isActive: false }, memberLimitExceeded: true } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader(args));
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.pageState).toBe("invalid-token");
});

it("shows invalid-token after a failed availability check, even with an older cached link", async () => {
  await loader(args);
  jest.mocked(axios.get).mockRejectedValue({ response: { status: 404, data: {} } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader(args));
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.pageState).toBe("invalid-token");
  expect(result.current.invite).toBeNull();
  expect(axios.get).toHaveBeenCalledTimes(2);
});

it("redirects without fetching when the token is missing", async () => {
  expect(await loader({ params: {} })).toMatchObject({ status: 302 });
  expect(axios.get).not.toHaveBeenCalled();
});
