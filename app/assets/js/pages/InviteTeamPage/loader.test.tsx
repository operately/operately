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

const inviteLink = { token: "original", isActive: true, allowedDomains: [] };

it("reuses the prefetched company link and subscribes to refreshed data", async () => {
  jest.mocked(axios.post).mockResolvedValue({ data: { inviteLink } });
  const inputs = await loader();
  expect(inputs).toEqual({ queryInput: {} });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  await loader();
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(result.current.link.token).toBe("original");

  jest.mocked(axios.post).mockResolvedValue({ data: { inviteLink: { ...inviteLink, token: "new" } } });
  await act(() => queryClient.invalidateQueries());
  await waitFor(() => expect(result.current.link.token).toBe("new"));
});

it("does not reuse the link across companies", async () => {
  jest.mocked(axios.post).mockResolvedValue({ data: { inviteLink } });
  Api.default.setHeaders({ "x-company-id": "first" });
  await loader();
  Api.default.setHeaders({ "x-company-id": "second" });
  jest.mocked(axios.post).mockResolvedValue({ data: { inviteLink: { ...inviteLink, token: "second" } } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader());
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.link.token).toBe("second");
  expect(axios.post).toHaveBeenCalledTimes(2);
});

it("propagates authorization failures", async () => {
  jest.mocked(axios.post).mockRejectedValue({ response: { status: 404, data: {} } });
  await expect(loader()).rejects.toMatchObject({ response: { status: 404 } });
});
