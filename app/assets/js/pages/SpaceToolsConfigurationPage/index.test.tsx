/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useNavigate } from "react-router";
import { SpaceToolsConfigurationPage, showErrorToast } from "turboui";
import PageModule from "./index";
import { loader } from "./loader";

jest.mock("axios");
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));
jest.mock("@/models/spaces", () => jest.requireActual("@/models/spaces/spaceLifecycle"));
jest.mock("@/routes/paths", () => ({
  ...jest.requireActual("@/routes/paths"),
  usePaths: () => ({ spacePath: (id: string) => `/spaces/${id}` }),
}));
jest.mock("react-router", () => ({ useNavigate: jest.fn() }));
jest.mock("turboui", () => ({ SpaceToolsConfigurationPage: jest.fn(() => null), showErrorToast: jest.fn() }));

const initialTools = {
  discussionsEnabled: true,
  resourceHubEnabled: true,
  tasksEnabled: false,
  kpisEnabled: false,
  templatesEnabled: true,
};
const changedTools = {
  discussionsEnabled: false,
  resourceHubEnabled: false,
  tasksEnabled: true,
  kpisEnabled: true,
  templatesEnabled: false,
};
const navigate = jest.fn();
let root: Root;
let savedTools: typeof initialTools;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
  queryClient.clear();
  jest.clearAllMocks();
  savedTools = { ...initialTools };
  jest.mocked(useNavigate).mockReturnValue(navigate);
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: String(url).endsWith("/spaces/list_tools")
      ? { tools: savedTools }
      : { space: { id: "space-1", name: "Marketing" } },
  }));
  root = createRoot(document.createElement("div"));
});

afterEach(async () => {
  await act(async () => root.unmount());
  queryClient.clear();
});

function pageProps(): SpaceToolsConfigurationPage.Props {
  const calls = jest.mocked(SpaceToolsConfigurationPage).mock.calls;
  const lastCall = calls[calls.length - 1];
  if (!lastCall) throw new Error("Configuration page has not rendered");
  return lastCall[0];
}

async function visit(id = "space-1") {
  const inputs = await loader({ params: { id } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const Page = PageModule.Page;
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    );
  });
  return inputs;
}

async function flushQueryUpdates() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

it("starts both loader requests concurrently", async () => {
  let finishSpace = () => {};
  jest.mocked(axios.get).mockImplementation((url) => {
    if (String(url).endsWith("/spaces/list_tools")) {
      return Promise.resolve({ data: { tools: initialTools } });
    }
    return new Promise((resolve) => {
      finishSpace = () => resolve({ data: { space: { id: "space-1", name: "Marketing" } } });
    });
  });
  const pending = loader({ params: { id: "space-1" } });
  expect(jest.mocked(axios.get).mock.calls.map(([url]) => url)).toEqual([
    "/api/v2/spaces/get",
    "/api/v2/spaces/list_tools",
  ]);
  finishSpace();
  await pending;
});

it("returns loader inputs and reuses both cached queries on mount and re-entry", async () => {
  expect(await visit()).toEqual({ spaceQueryInput: { id: "space-1" }, toolsQueryInput: { spaceId: "space-1" } });
  expect(pageProps().tools).toEqual(initialTools);
  await act(async () => root.render(null));
  await visit();
  expect(axios.get).toHaveBeenCalledTimes(2);
});

it.each(["space", "tools"])("rejects missing %s data explicitly", async (missing) => {
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: String(url).endsWith("/spaces/list_tools")
      ? { tools: missing === "tools" ? null : initialTools }
      : { space: missing === "space" ? null : { id: "space-1", name: "Marketing" } },
  }));
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await expect(visit()).rejects.toThrow(/unavailable/);
  } finally {
    consoleError.mockRestore();
  }
});

it("keeps unsaved settings when background queries update", async () => {
  await visit();
  await act(async () => pageProps().onToolsChange(changedTools));
  await act(async () => {
    queryClient.setQueryData(Api.spaces.listToolsQueryKey({ spaceId: "space-1" }), { tools: initialTools });
    queryClient.setQueryData(Api.spaces.getQueryKey({ id: "space-1" }), {
      space: { id: "growth-1", name: "Growth" },
    });
    await flushQueryUpdates();
  });
  expect(pageProps().title).toEqual(["Configure tools", "Growth"]);
  expect(pageProps().tools).toEqual(changedTools);
});

it("resets the form when navigating to another space", async () => {
  await visit();
  await act(async () => pageProps().onToolsChange(changedTools));
  queryClient.setQueryData(Api.spaces.getQueryKey({ id: "space-2" }), {
    space: { id: "space-2", name: "Engineering" },
  });
  queryClient.setQueryData(Api.spaces.listToolsQueryKey({ spaceId: "space-2" }), { tools: initialTools });
  await visit("space-2");
  expect(pageProps().tools).toEqual(initialTools);
});

it("saves all toggles, tracks pending state, and reloads saved settings on re-entry", async () => {
  await visit();
  await act(async () => pageProps().onToolsChange(changedTools));
  let finishSave = () => {};
  jest.mocked(axios.post).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishSave = () => {
          savedTools = { ...changedTools };
          resolve({ data: { success: true, tools: savedTools } });
        };
      }),
  );
  let pending: Promise<void> | undefined;
  await act(async () => {
    pending = pageProps().onSave();
    await flushQueryUpdates();
  });
  expect(pageProps().isSubmitting).toBe(true);
  expect(navigate).not.toHaveBeenCalled();
  expect(axios.post).toHaveBeenCalledWith(
    "/api/v2/spaces/update_tools",
    {
      space_id: "space-1",
      tools: {
        discussions_enabled: false,
        resource_hub_enabled: false,
        tasks_enabled: true,
        kpis_enabled: true,
        templates_enabled: false,
      },
    },
    expect.anything(),
  );
  await act(async () => {
    finishSave();
    await pending;
    await flushQueryUpdates();
  });
  expect(pageProps().isSubmitting).toBe(false);
  expect(navigate).toHaveBeenCalledWith("/spaces/space-1");
  await act(async () => root.render(null));
  await visit();
  expect(pageProps().tools).toEqual(changedTools);
  expect(axios.get).toHaveBeenCalledTimes(4);
});

it("shows a failed save, preserves edits, and allows retry", async () => {
  await visit();
  await act(async () => pageProps().onToolsChange(changedTools));
  jest.mocked(axios.post).mockRejectedValueOnce(new Error("Save failed"));
  await act(async () => {
    await pageProps().onSave();
    await flushQueryUpdates();
  });
  expect(showErrorToast).toHaveBeenCalledWith("Could not save tool settings", "Please try again.");
  expect(pageProps().isSubmitting).toBe(false);
  expect(pageProps().tools).toEqual(changedTools);
  expect(navigate).not.toHaveBeenCalled();
  expect(axios.get).toHaveBeenCalledTimes(2);

  jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: true, tools: changedTools } });
  await act(async () => {
    await pageProps().onSave();
  });
  expect(navigate).toHaveBeenCalledWith("/spaces/space-1");
});

it("cancels without persisting changes", async () => {
  await visit();
  await act(async () => pageProps().onToolsChange(changedTools));
  await act(async () => pageProps().onCancel());
  expect(axios.post).not.toHaveBeenCalled();
  expect(navigate).toHaveBeenCalledWith("/spaces/space-1");
  await act(async () => root.render(null));
  await visit();
  expect(pageProps().tools).toEqual(initialTools);
});
