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
const inviteLink = { token: "company-link", company: { name: "Company" } };

it("prefetches the full-company invitation and observes cache updates", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { inviteLink, memberLimitExceeded: true } });
  const inputs = await loader(args);
  expect(inputs).toEqual({ queryInput: { token: "company-link" } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.invite?.company?.name).toBe("Company");
  expect(axios.get).toHaveBeenCalledTimes(1);
  jest.mocked(axios.get).mockResolvedValue({
    data: { inviteLink: { ...inviteLink, company: { name: "Renamed" } }, memberLimitExceeded: true },
  });
  await act(() =>
    queryClient.invalidateQueries({ queryKey: Api.invitations.getInviteLinkAvailabilityQueryKeyPrefix() }),
  );
  await waitFor(() => expect(result.current.invite?.company?.name).toBe("Renamed"));
});

it("redirects when capacity is available, including after a previous full result", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { inviteLink, memberLimitExceeded: true } });
  await loader(args);
  jest.mocked(axios.get).mockResolvedValue({ data: { inviteLink, memberLimitExceeded: false } });
  const result = await loader(args);
  expect(result).toMatchObject({ status: 302 });
  if ("headers" in result) expect(result.headers.get("Location")).toBe("/join/company-link");
  expect(axios.get).toHaveBeenCalledTimes(2);
});

it("redirects to the join page when the availability check fails", async () => {
  jest.mocked(axios.get).mockRejectedValue({ response: { status: 404, data: {} } });
  const result = await loader(args);
  expect(result).toMatchObject({ status: 302 });
  if ("headers" in result) expect(result.headers.get("Location")).toBe("/join/company-link");
});

it("redirects without fetching when the token is missing", async () => {
  expect(await loader({ params: {} })).toMatchObject({ status: 302 });
  expect(axios.get).not.toHaveBeenCalled();
});
