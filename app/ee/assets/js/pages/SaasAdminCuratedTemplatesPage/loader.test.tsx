/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import { QueryClientProvider } from "@tanstack/react-query";
import AdminApi from "@/ee/admin_api";
import { queryClient } from "@/api/queryClient";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { loader, useLoadedData } from "./loader";
import { templateFixture } from "../../../../../../turboui/src/CuratedTemplates/mockData";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/ee/admin_api/staleClient", () => ({ handleStaleClientError: jest.fn() }));

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  AdminApi.default.setBasePath("/admin/api");
});
afterEach(() => queryClient.clear());

it("loads all templates in one request and reuses them on mount and reentry", async () => {
  const templates = Array.from({ length: 101 }, (_, index) => ({
    ...templateFixture("project"),
    id: `project-${index}`,
  }));
  jest.mocked(axios.get).mockResolvedValue({ data: { templates, total: templates.length } });
  await loader();
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.templates).toEqual(templates);
  await loader();
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(axios.get).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ params: {} }));
});

it("refreshes the full catalog after template mutations invalidate the list", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { templates: [], total: 0 } });
  await loader();
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  const templates = [templateFixture("goal")];
  jest.mocked(axios.get).mockResolvedValue({ data: { templates, total: 1 } });
  await act(() => queryClient.invalidateQueries({ queryKey: AdminApi.curated_templates.listQueryKeyPrefix() }));
  await waitFor(() => expect(result.current.templates).toEqual(templates));
});

it("fails the initial load when the catalog cannot be fetched", async () => {
  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  await expect(loader()).rejects.toThrow("Offline");
});
