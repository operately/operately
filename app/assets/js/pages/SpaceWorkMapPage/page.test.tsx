/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Space, WorkMapItem } from "@/api";
import { dismissToast, showErrorToast, WorkMapPage } from "turboui";
import { Page } from "./page";
import { useLoadedData } from "./loader";

jest.mock("./loader", () => ({ useLoadedData: jest.fn() }));
jest.mock("turboui", () => ({
  WorkMapPage: jest.fn(() => null),
  showErrorToast: jest.fn(() => "creation-error-toast"),
  dismissToast: jest.fn(),
}));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("@/models/spaces", () => ({
  useSpaceSearch: () => jest.fn(),
}));
jest.mock("@/models/workMap", () => ({
  useWorkMapItems: jest.fn((items: WorkMapItem[]) => [items, jest.fn()]),
  convertToWorkMapItems: (_paths: unknown, items: WorkMapItem[]) => items,
}));
const mockNavigate = jest.fn();
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    spacePath: (id: string) => `/spaces/${id}`,
    newProjectTemplatePath: (id: string) => `/spaces/${id}/templates/new`,
  }),
}));
jest.mock("react-router", () => ({ useNavigate: () => mockNavigate }));

describe("SpaceWorkMapPage creation readiness", () => {
  let root: Root;
  let client: QueryClient;
  let loaded: ReturnType<typeof useLoadedData>;
  const space: Space = {
    __typename: "space",
    id: "space-1",
    name: "Engineering",
    permissions: {
      __typename: "space_permissions",
      canEdit: true,
      canView: true,
      canComment: true,
      hasFullAccess: true,
    },
  };

  const workItem: WorkMapItem = {
    __typename: "work_map_item",
    id: "project-1",
    name: "Launch",
    type: "project",
    parentId: null,
    state: "active",
    status: "pending",
    taskStatus: null,
    progress: 0,
    space,
    spacePath: "/spaces/space-1",
    project: null,
    projectPath: null,
    owner: null,
    ownerPath: null,
    reviewer: null,
    reviewerPath: null,
    nextStep: "",
    isNew: false,
    completedOn: null,
    timeframe: null,
    assignedAt: null,
    milestones: [],
    targets: [],
    checklist: [],
    children: [],
    itemPath: "/projects/project-1",
    privacy: "internal",
  };

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    client = new QueryClient();
    root = createRoot(document.createElement("div"));
    loaded = {
      data: { space, workMap: [], templates: [] },
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

  it.each([{ workMap: [] }, { workMap: [workItem] }])(
    "renders the map and space navigation while templates load: %j",
    async ({ workMap }) => {
      loaded.data.workMap = workMap;
      loaded.creationData.isLoading = true;
      expect(await renderPage()).toMatchObject({
        items: workMap,
        addingEnabled: false,
        creationLoading: true,
        creationError: false,
        navigation: [{ to: "/spaces/space-1", label: "Engineering" }],
        addItemDefaultSpace: { id: space.id, name: space.name, link: "/spaces/space-1" },
      });
      expect(showErrorToast).not.toHaveBeenCalled();
    },
  );

  it("enables creation after an empty template response", async () => {
    expect(await renderPage()).toMatchObject({ addingEnabled: true, creationLoading: false, creationError: false });
  });

  it.each([false, undefined])("keeps creation disabled without edit permission: %s", async (canEdit) => {
    loaded.data.space = {
      ...space,
      permissions:
        canEdit === undefined
          ? undefined
          : {
              __typename: "space_permissions",
              canEdit,
              canView: true,
              canComment: false,
              hasFullAccess: false,
            },
    };
    expect((await renderPage()).addingEnabled).toBe(false);
  });

  it.each([true, false])("preserves private space controls: %s", async (privateSpace) => {
    loaded.data.space = { ...space, privateSpace };
    expect((await renderPage()).hideCompanyAccessInQuickAdd).toBe(privateSpace);
  });

  it("preserves template selection data and template creation navigation", async () => {
    loaded.data.templates = [
      {
        __typename: "project_template",
        id: "template-1",
        name: "Launch",
        space,
        insertedAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        milestoneCount: 0,
        taskCount: 0,
        inactivePeopleSummary: { personCount: 0, roleCount: 0, taskCount: 0 },
        inactiveDiscussionCount: 0,
      },
    ];
    const props = await renderPage();
    expect(props.projectTemplates).toEqual([
      expect.objectContaining({ id: "template-1", name: "Launch", spaceId: space.id }),
    ]);
    props.onCreateProjectTemplate?.(space.id);
    expect(mockNavigate).toHaveBeenCalledWith("/spaces/space-1/templates/new");
  });

  it("shows one persistent toast on failure and uses the latest retry action", async () => {
    loaded.creationData.isLoading = true;
    await renderPage();
    expect(showErrorToast).not.toHaveBeenCalled();
    loaded.creationData.isLoading = false;
    loaded.creationData.error = new Error("Offline");
    expect(await renderPage()).toMatchObject({ addingEnabled: false, creationError: true });
    expect(showErrorToast).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        id: "space-work-map-creation-space-1",
        duration: Infinity,
        action: expect.objectContaining({ onClick: expect.any(Function) }),
      }),
    );
    dismissToast("creation-error-toast");
    loaded.creationData.retry = jest.fn();
    await renderPage();
    expect(showErrorToast).toHaveBeenCalledTimes(1);
    jest.mocked(showErrorToast).mock.calls[0]?.[2]?.action?.onClick();
    expect(loaded.creationData.retry).toHaveBeenCalledTimes(1);
  });

  it.each([true, false])("dismisses the toast when retrying or recovering, loading=%s", async (isLoading) => {
    loaded.creationData.error = new Error("Offline");
    await renderPage();
    loaded.creationData = { ...loaded.creationData, error: null, isLoading };
    await renderPage();
    expect(dismissToast).toHaveBeenCalledWith("creation-error-toast");
  });

  it("dismisses the toast when leaving the page", async () => {
    loaded.creationData.error = new Error("Offline");
    await renderPage();
    await act(async () => root.render(null));
    expect(dismissToast).toHaveBeenCalledWith("creation-error-toast");
  });

  it("cleans up the previous space toast when navigating between spaces", async () => {
    loaded.creationData.error = new Error("Offline");
    await renderPage();
    loaded.data.space = { ...space, id: "space-2" };
    await renderPage();
    expect(dismissToast).toHaveBeenCalledWith("creation-error-toast");
    expect(showErrorToast).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        id: "space-work-map-creation-space-2",
      }),
    );
  });
});
