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

const args = { request: { url: "http://localhost/join?token=personal" } as Request };
const inviteLink = { token: "personal", company: { name: "Company" } };
const member = { id: "member", fullName: "Member" };

it("prefetches the invitation and observes cache updates without a duplicate mount request", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { inviteLink, member } });
  const inputs = await loader(args);
  expect(inputs).toEqual({ queryInput: { token: "personal" } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current?.member.fullName).toBe("Member");
  expect(axios.get).toHaveBeenCalledTimes(1);
  jest.mocked(axios.get).mockResolvedValue({ data: { inviteLink, member: { ...member, fullName: "Updated" } } });
  await act(() => queryClient.invalidateQueries({ queryKey: Api.invitations.getInvitationQueryKeyPrefix() }));
  await waitFor(() => expect(result.current?.member.fullName).toBe("Updated"));
});

it("checks the token again on re-entry so a revoked invitation is not reused", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { inviteLink, member } });
  await loader(args);
  jest.mocked(axios.get).mockResolvedValue({ data: { inviteLink: null } });
  expect(await loader(args)).toMatchObject({ status: 302 });
  expect(axios.get).toHaveBeenCalledTimes(2);
});

it("redirects without fetching when the token is missing", async () => {
  expect(await loader({ request: { url: "http://localhost/join" } as Request })).toMatchObject({ status: 302 });
  expect(axios.get).not.toHaveBeenCalled();
});

it("propagates invitation errors", async () => {
  jest.mocked(axios.get).mockRejectedValue({ response: { status: 404, data: {} } });
  await expect(loader(args)).rejects.toMatchObject({ response: { status: 404 } });
});

it("allows the page to unmount its form when login clears the cache before redirecting", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { inviteLink, member } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader(args));
  const { result, rerender } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  jest.mocked(axios.get).mockImplementation(() => new Promise(() => {}));
  act(() => {
    queryClient.clear();
    rerender(undefined);
  });
  expect(result.current).toBeNull();
});
