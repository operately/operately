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
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
const company = { id: "company1", name: "Company", permissions: { isAdmin: true }, admins: [], owners: [] };
const people = [{ id: "person1", fullName: "Person", hasOpenInvitation: false, isGuest: false }];

beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  queryClient.clear();
  jest.clearAllMocks();
  jest.mocked(axios.get).mockResolvedValue({ data: { company, people } });
});
afterEach(() => queryClient.clear());

it("reuses prefetched data on mount and route re-entry", async () => {
  const inputs = await loader();
  expect(inputs).not.toHaveProperty("company");
  expect(inputs).not.toHaveProperty("people");
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result, unmount } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.company).toEqual(company);
  unmount();
  await loader();
  renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(axios.get).toHaveBeenCalledTimes(1);
});

it("updates mounted data after invalidation", async () => {
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader());
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  jest.mocked(axios.get).mockResolvedValue({ data: { company: { ...company, name: "Renamed" }, people: [] } });
  await act(async () => {
    await queryClient.invalidateQueries({ queryKey: Api.companies.getQueryKeyPrefix() });
  });
  await waitFor(() => expect(result.current.company.name).toBe("Renamed"));
});

it("rejects non-admins before loading the page", async () => {
  jest
    .mocked(axios.get)
    .mockResolvedValue({ data: { company: { ...company, permissions: { isAdmin: false } }, people } });
  const originalResponse = Object.getOwnPropertyDescriptor(globalThis, "Response");
  Object.defineProperty(globalThis, "Response", {
    configurable: true,
    value: jest.fn().mockReturnValue({ status: 404 }),
  });
  try {
    await expect(loader()).rejects.toMatchObject({ status: 404 });
  } finally {
    if (originalResponse) Object.defineProperty(globalThis, "Response", originalResponse);
    else Reflect.deleteProperty(globalThis, "Response");
  }
});
