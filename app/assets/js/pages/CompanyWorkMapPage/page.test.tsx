/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Company, WorkMapItem } from "@/api";
import { useWorkMapItems } from "@/models/workMap";
import { dismissToast, showErrorToast, WorkMapPage } from "turboui";
import { Page } from "./page";
import { useLoadedData } from "./loader";

jest.mock("./loader", () => ({ useLoadedData: jest.fn() }));
jest.mock("turboui", () => ({
  WorkMapPage: jest.fn(() => null),
  showErrorToast: jest.fn(() => "creation-error-toast"),
  dismissToast: jest.fn(),
}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "me" }) }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("@/routes/useCompanyLoaderData", () => ({
  useCompanyLoaderData: () => ({ company: { name: "Parent company", setupCompleted: false, owners: [{ id: "me" }] } }),
}));
jest.mock("@/models/spaces", () => ({
  useSpaceSearch: () => jest.fn(),
  parseSpaceForTurboUI: (_paths: unknown, space: { id: string; name: string }) => ({ ...space, link: "/general" }),
}));
jest.mock("@/models/workMap", () => ({
  useWorkMapItems: jest.fn((items: WorkMapItem[]) => [items, jest.fn()]),
  convertToWorkMapItems: (_paths: unknown, items: WorkMapItem[]) => items,
}));
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({}),
  includesId: (ids: string[], id: string) => ids.includes(id),
}));
jest.mock("react-router", () => ({ useNavigate: () => jest.fn() }));

describe("CompanyWorkMapPage creation readiness", () => {
  let root: Root;
  let client: QueryClient;
  let loaded: ReturnType<typeof useLoadedData>;
  const company: Company = {
    __typename: "company",
    id: "company-1",
    name: "Fresh company",
    setupCompleted: false,
    generalSpace: { __typename: "space", id: "general", name: "General" },
  };

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    client = new QueryClient();
    root = createRoot(document.createElement("div"));
    loaded = {
      data: { company, workMap: [], spacesCount: 1, templates: [] },
      creationData: { isLoading: false, error: null, retry: jest.fn() },
    };
    jest.mocked(useLoadedData).mockImplementation(() => loaded);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
    jest.clearAllMocks();
  });

  async function renderPage() {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Page />
        </QueryClientProvider>,
      ),
    );
    const props = jest.mocked(WorkMapPage).mock.calls.at(-1)?.[0];
    if (!props) throw new Error("Work map was not rendered");
    return props;
  }

  it("uses the parent title and renders while company details are pending", async () => {
    loaded.data.company = undefined;
    loaded.creationData.isLoading = true;
    expect(await renderPage()).toMatchObject({
      title: "Parent company Work Map",
      creationLoading: true,
      addingEnabled: false,
      emptyStateVariant: "standard",
    });
  });

  it("enables first-project onboarding only after its default space is available", async () => {
    loaded.data.company = { ...company, generalSpace: undefined };
    expect((await renderPage()).emptyStateVariant).toBe("standard");
    loaded.data.company = company;
    const props = await renderPage();
    expect(props).toMatchObject({
      title: "Fresh company Work Map",
      addingEnabled: true,
      emptyStateVariant: "first-project",
      addItemDefaultSpace: { id: "general" },
    });
    expect(props.onItemCreated).toBeDefined();
    expect(useWorkMapItems).toHaveBeenLastCalledWith([], { projectChampionId: "me" });
  });

  it("does not enable creation for a member without editable spaces", async () => {
    loaded.data.spacesCount = 0;
    expect(await renderPage()).toMatchObject({ addingEnabled: false, creationError: false, creationLoading: false });
  });

  it("shows one persistent toast after retries fail and uses the latest retry action", async () => {
    loaded.creationData.isLoading = true;
    await renderPage();
    expect(showErrorToast).not.toHaveBeenCalled();
    loaded.creationData.isLoading = false;
    loaded.creationData.error = new Error("Offline");
    const props = await renderPage();
    expect(props).toMatchObject({ addingEnabled: false, creationError: true });
    expect(showErrorToast).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ duration: Infinity }),
    );
    loaded.creationData.retry = jest.fn();
    await renderPage();
    expect(showErrorToast).toHaveBeenCalledTimes(1);
    jest.mocked(showErrorToast).mock.calls[0]?.[2]?.action?.onClick();
    expect(loaded.creationData.retry).toHaveBeenCalledTimes(1);
  });

  it("dismisses the toast when data recovers", async () => {
    loaded.creationData.error = new Error("Offline");
    await renderPage();
    loaded.creationData.error = null;
    await renderPage();
    expect(dismissToast).toHaveBeenCalledWith("creation-error-toast");
  });

  it("dismisses the toast when leaving the page", async () => {
    loaded.creationData.error = new Error("Offline");
    await renderPage();
    await act(async () => root.render(null));
    expect(dismissToast).toHaveBeenCalledWith("creation-error-toast");
  });
});
