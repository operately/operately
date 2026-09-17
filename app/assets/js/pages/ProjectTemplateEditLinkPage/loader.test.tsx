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
jest.mock("react-router", () => ({}));

const template = {
  id: "template1",
  name: "Original",
  space: { id: "space1" },
  resourceNodes: [{ id: "node1", type: "link", link: { id: "child1", name: "Resource", blob: { url: "/file" } } }],
};
const response = { template, discussion: { id: "node1", title: "Notes", body: "" }, comments: [] };
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeAll(() => {
  Object.defineProperty(globalThis, "Response", {
    configurable: true,
    value: class extends Error {
      status: number;

      constructor(message: string, init: { status: number }) {
        super(message);
        this.status = init.status;
      }
    },
  });
});

beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
  jest.mocked(axios.get).mockResolvedValue({ data: response });
});

afterEach(() => queryClient.clear());

async function visit() {
  const args = {
    params: { templateId: "template1", id: "node1" },
    request: { url: "http://localhost/new?folderId=folder1&type=figma" },
  };
  const inputs = await loader(args);
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);

  return inputs;
}

it("reuses prefetched data on mount and cached route re-entry", async () => {
  const inputs = await visit();
  expect(inputs).not.toHaveProperty("template");

  const { result, unmount } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.template.name).toBe("Original");
  unmount();

  await visit();
  renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(axios.get).toHaveBeenCalledTimes(1);
});

it("subscribes to invalidation and retains cached data after a background failure", async () => {
  await visit();
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  jest.mocked(axios.get).mockResolvedValue({ data: { ...response, template: { ...template, name: "Updated" } } });

  await act(() => queryClient.invalidateQueries({ queryKey: Api.project_templates.getQueryKeyPrefix() }));
  await waitFor(() => expect(result.current.template.name).toBe("Updated"));

  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  await act(() => queryClient.invalidateQueries());
  expect(result.current.template.name).toBe("Updated");
});

it.each([null, { ...template, space: null }])("guards missing template data or its space", async (value) => {
  await visit();
  queryClient.setQueryData(Api.project_templates.getQueryKey({ id: "template1" }), { template: value });
  const log = jest.spyOn(console, "error").mockImplementation(() => {});

  try {
    expect(() => renderHook(useLoadedData, { initialProps: undefined, wrapper })).toThrow(/Template/);
  } finally {
    log.mockRestore();
  }
});

it.each([{ resourceNodes: [] }, { resourceNodes: [{ ...template.resourceNodes[0], type: "folder" }] }])(
  "rejects missing or mismatched resource nodes",
  async ({ resourceNodes }) => {
    jest.mocked(axios.get).mockResolvedValue({ data: { template: { ...template, resourceNodes } } });
    await expect(visit()).rejects.toMatchObject({ status: 404 });
  },
);
