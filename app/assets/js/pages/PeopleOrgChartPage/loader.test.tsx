/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Pages from "@/components/Pages";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { useUpdateProfile } from "@/models/people/profileLifecycle";
import { loader, useLoadedData } from "./loader";
import { useOrgChart } from "./useOrgChart";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));
jest.mock("react-router", () => ({}));

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
const people = [
  { id: "manager1", fullName: "Manager" },
  { id: "person1", fullName: "Person", manager: { id: "manager1" } },
];

beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  queryClient.clear();
  jest.clearAllMocks();
  jest.mocked(axios.get).mockResolvedValue({ data: { people } });
});
afterEach(() => queryClient.clear());

it("prefetches the org chart and reuses it on mount and route re-entry", async () => {
  const inputs = await loader();
  expect(inputs).not.toHaveProperty("people");
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result, unmount } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.people).toEqual(people);
  unmount();
  await loader();
  renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(axios.get).toHaveBeenCalledTimes(1);
});

it("updates a mounted org chart after changing a person's manager", async () => {
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader());
  const { result } = renderHook(
    () => ({
      chart: useOrgChart(useLoadedData().people),
      update: useUpdateProfile(),
    }),
    { initialProps: undefined, wrapper },
  );
  expect(result.current.chart.root.map((node) => node.person.id)).toEqual(["manager1"]);
  jest.mocked(axios.post).mockResolvedValue({ data: { person: people[1] } });
  jest.mocked(axios.get).mockResolvedValue({ data: { people: [people[0], { ...people[1], manager: null }] } });
  await act(() => result.current.update.mutateAsync({ id: "person1", managerId: null }));
  await waitFor(() => expect(result.current.chart.root.map((node) => node.person.id)).toEqual(["manager1", "person1"]));
});

it("supports an empty org chart", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { people: [] } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader());
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.people).toEqual([]);
});
