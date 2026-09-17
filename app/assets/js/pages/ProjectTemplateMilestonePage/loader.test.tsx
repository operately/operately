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
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));
jest.mock("react-router", () => ({ redirect: (path: string) => new Error(path) }));

const template = {
  id: "template1",
  name: "Template",
  space: { id: "space1" },
  milestones: [{ id: "milestone1", title: "Kickoff" }],
};

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
  jest.mocked(axios.get).mockResolvedValue({ data: { template } });
});

afterEach(() => queryClient.clear());

async function visit() {
  const inputs = await loader({ params: { companyId: "company1", templateId: "template1", id: "milestone1" } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);

  return inputs;
}

it("prefetches and subscribes without duplicate requests on mount or cached route re-entry", async () => {
  const inputs = await visit();
  expect(inputs).not.toHaveProperty("template");

  const { result, unmount } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.template.name).toBe("Template");

  unmount();
  await visit();
  renderHook(useLoadedData, { initialProps: undefined, wrapper });

  expect(axios.get).toHaveBeenCalledTimes(1);
});

it("updates after invalidation and retains cached content when a background request fails", async () => {
  await visit();
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });

  jest.mocked(axios.get).mockResolvedValue({ data: { template: { ...template, name: "Updated" } } });
  await act(() => queryClient.invalidateQueries({ queryKey: Api.project_templates.getQueryKeyPrefix() }));
  await waitFor(() => expect(result.current.template.name).toBe("Updated"));

  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  await act(() => queryClient.invalidateQueries({ queryKey: Api.project_templates.getQueryKeyPrefix() }));

  expect(result.current.template.name).toBe("Updated");
});

it("guards unavailable template data", async () => {
  await visit();
  queryClient.setQueryData(Api.project_templates.getQueryKey({ id: "template1" }), { template: null });
  const log = jest.spyOn(console, "error").mockImplementation(() => {});

  try {
    expect(() => renderHook(useLoadedData, { initialProps: undefined, wrapper })).toThrow(/Template data/);
  } finally {
    log.mockRestore();
  }
});

it("redirects missing milestones during loading", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { template: { ...template, milestones: [] } } });

  await expect(visit()).rejects.toThrow(/project-templates/);
});
