/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api from "@/api";
import { useLoadedData } from "./loader";
import { ProjectPage, showErrorToast } from "turboui";
import PageModule from "./index";

const mockRefresh = jest.fn();
jest.mock("./loader", () => ({ loader: jest.fn(), useLoadedData: jest.fn(), useRefreshCore: () => mockRefresh }));
const mockNavigate = jest.fn();
const mockEmpty: [] = [];
const mockPaths = new Proxy({}, { get: (_, name) => (id: string) => `/${String(name)}/${id ?? ""}` });
let mockProps: ProjectPage.Props;

jest.mock("turboui", () => ({
  showErrorToast: jest.fn(),
  ProjectPage: (props: ProjectPage.Props) => {
    mockProps = props;
    return null;
  },
}));
jest.mock("react-router", () => ({ useNavigate: () => mockNavigate }));
jest.mock("@/routes/paths", () => ({ compareIds: (a: string, b: string) => a === b, usePaths: () => mockPaths }));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => null }));
jest.mock("@/models/projects", () => ({
  ...jest.requireActual("@/models/projects/projectLifecycle"),
  ...jest.requireActual("@/models/projects/saveProjectAsTemplate"),
  useProjectContributorActions: () => ({ contributors: mockEmpty }),
  useProjectOtherPeopleWithAccess: () => ({}),
  useProjectSearch: () => jest.fn(),
  useTaskStatuses: () => ({ statuses: mockEmpty }),
  useProjectMilestoneOrdering: () => ({ milestones: mockEmpty, orderingState: mockEmpty }),
}));
jest.mock("@/models/projectTemplates", () => jest.requireActual("@/models/projectTemplates/projectTemplateLifecycle"));
jest.mock("@/models/tasks", () => ({
  useProjectTasksForTurboUi: () => ({ tasks: mockEmpty }),
  useKanbanState: () => ({}),
  useTaskSlideInProps: () => ({}),
  useTaskAssigneeSearch: () => jest.fn(),
}));
jest.mock("@/models/people", () => ({ parsePersonForTurboUi: () => null, usePersonFieldSearch: () => jest.fn() }));
jest.mock("@/models/spaces", () => ({ useSpaceSearch: () => jest.fn() }));
jest.mock("@/models/goals", () => ({
  accessLevelsAsStrings: () => ({}),
  parseParentGoalForTurboUi: (_paths: unknown, goal: unknown) => goal,
}));
jest.mock("@/models/milestones", () => ({
  parseMilestonesForTurboUi: () => ({ orderedMilestones: mockEmpty, orderingState: mockEmpty }),
}));
jest.mock("@/models/projectCheckIns", () => ({ parseCheckInsForTurboUi: () => mockEmpty }));
jest.mock("@/models/subscriptions", () => ({ useSubscription: () => ({}) }));
jest.mock("@/models/resourceHubs", () => ({
  useCreateFolder: () => ({ mutateAsync: jest.fn() }),
  useNewFileModalsContextValue: () => ({}),
  useAddFileWidgetProps: () => ({}),
  useResourceHubNodesListProps: () => ({}),
}));
jest.mock("@/models/search/resourceHub", () => ({ useResourceHubSearchProps: () => ({}) }));
jest.mock("@/hooks/useRichEditorHandlers", () => ({ useRichEditorHandlers: () => ({}) }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("./contentQueries", () => ({
  useProjectContentQueries: () => ({
    checkIns: mockEmpty,
    discussions: mockEmpty,
    backendTasks: mockEmpty,
    tasksLoaded: true,
    refresh: jest.fn(),
  }),
}));
jest.mock("@/features/Feed", () => ({ Feed: () => null, useFeedItemsQuery: () => ({}) }));

function deferred() {
  let resolve!: (value: any) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<any>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe("Project Page detail actions", () => {
  let root: Root;
  let client: QueryClient;
  let requests: Record<
    | "updateNameMutationOptions"
    | "updateDescriptionMutationOptions"
    | "updateStartDateMutationOptions"
    | "updateDueDateMutationOptions"
    | "updateParentGoalMutationOptions"
    | "deleteMutationOptions"
    | "template",
    jest.Mock
  >;

  beforeEach(async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
    requests = {
      updateNameMutationOptions: jest.fn(),
      updateDescriptionMutationOptions: jest.fn(),
      updateStartDateMutationOptions: jest.fn(),
      updateDueDateMutationOptions: jest.fn(),
      updateParentGoalMutationOptions: jest.fn(),
      deleteMutationOptions: jest.fn(),
      template: jest.fn(),
    };
    for (const key of [
      "updateNameMutationOptions",
      "updateDescriptionMutationOptions",
      "updateStartDateMutationOptions",
      "updateDueDateMutationOptions",
      "updateParentGoalMutationOptions",
      "deleteMutationOptions",
    ] as const) {
      requests[key] = jest.fn().mockResolvedValue({ project: { id: "project-1" }, success: true });
      jest.spyOn(Api.projects, key).mockReturnValue({ mutationFn: requests[key] });
    }
    requests.template = jest.fn().mockResolvedValue({ template: { id: "template-1" }, scheduleIssues: [] });
    jest
      .spyOn(Api.project_templates, "createFromProjectMutationOptions")
      .mockReturnValue({ mutationFn: requests.template });
    const loadedData = {
      data: {
        project: {
          id: "project-1",
          name: "Original",
          description: '{"type":"doc","content":[]}',
          goal: null,
          timeframe: null,
        },
        childrenCount: {},
        space: null,
      },
      refresh: jest.fn(),
    };
    jest.mocked(useLoadedData).mockReturnValue(loadedData as unknown as ReturnType<typeof useLoadedData>);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(Api.projects.getQueryKey({ id: "project-1" }), {});
    root = createRoot(document.createElement("div"));
    const Page = PageModule.Page;
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Page />
        </QueryClientProvider>,
      ),
    );
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
    jest.restoreAllMocks();
  });

  it("shows the new name before saving and invalidates the project query cache after success", async () => {
    const save = deferred();
    requests.updateNameMutationOptions.mockReturnValue(save.promise);
    await act(async () => {
      void mockProps.updateProjectName("Renamed");
    });
    expect(mockProps.project.name).toBe("Renamed");
    expect(client.getQueryState(Api.projects.getQueryKey({ id: "project-1" }))?.isInvalidated).toBe(false);
    await act(async () => save.resolve({ project: { id: "project-1", name: "Renamed" } }));
    expect(mockProps.project.name).toBe("Renamed");
    expect(client.getQueryState(Api.projects.getQueryKey({ id: "project-1" }))?.isInvalidated).toBe(true);
    expect(requests.updateNameMutationOptions).toHaveBeenCalledWith(
      { projectId: "project-1", name: "Renamed" },
      expect.anything(),
    );
  });

  it("rejects an empty name before changing the UI or sending a request", async () => {
    await act(async () => {
      await mockProps.updateProjectName("   ");
    });
    expect(mockProps.project.name).toBe("Original");
    expect(requests.updateNameMutationOptions).not.toHaveBeenCalled();
    expect(client.getQueryState(Api.projects.getQueryKey({ id: "project-1" }))?.isInvalidated).toBe(false);
    expect(showErrorToast).toHaveBeenCalled();
  });

  it("restores the previous name when saving fails", async () => {
    const save = deferred();
    requests.updateNameMutationOptions.mockReturnValue(save.promise);
    await act(async () => {
      void mockProps.updateProjectName("Renamed");
    });
    expect(mockProps.project.name).toBe("Renamed");
    await act(async () => save.reject(new Error("Save failed")));
    expect(mockProps.project.name).toBe("Original");
    expect(client.getQueryState(Api.projects.getQueryKey({ id: "project-1" }))?.isInvalidated).toBe(false);
    expect(showErrorToast).toHaveBeenCalled();
  });

  it("preserves a pending optimistic name during an unrelated core refresh", async () => {
    const save = deferred();
    requests.updateNameMutationOptions.mockReturnValue(save.promise);
    await act(async () => {
      void mockProps.updateProjectName("Renamed");
    });
    const loaded = jest.mocked(useLoadedData).mock.results.at(-1)?.value as ReturnType<typeof useLoadedData>;
    jest
      .mocked(useLoadedData)
      .mockReturnValue({ ...loaded, data: { ...loaded.data, project: { ...loaded.data.project, description: "{}" } } });
    const Page = PageModule.Page;
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Page />
        </QueryClientProvider>,
      ),
    );
    expect(mockProps.project.name).toBe("Renamed");
    await act(async () => save.resolve({ project: { id: "project-1", name: "Renamed" } }));
    expect(mockProps.project.name).toBe("Renamed");
  });

  const fields = [
    {
      name: "description",
      request: "updateDescriptionMutationOptions",
      value: () => mockProps.description,
      change: () => mockProps.onDescriptionChange("Updated description"),
    },
    {
      name: "start date",
      request: "updateStartDateMutationOptions",
      value: () => mockProps.startedAt,
      change: () => mockProps.setStartedAt?.({ date: new Date(2026, 8, 10), dateType: "day", value: "Sep 10, 2026" }),
    },
    {
      name: "due date",
      request: "updateDueDateMutationOptions",
      value: () => mockProps.dueAt,
      change: () => mockProps.setDueAt?.({ date: new Date(2026, 8, 12), dateType: "day", value: "Sep 12, 2026" }),
    },
    {
      name: "parent goal",
      request: "updateParentGoalMutationOptions",
      value: () => mockProps.parentGoal,
      change: () => mockProps.setParentGoal({ id: "goal-1", name: "Goal", link: "/goal" }),
    },
  ] as const;

  it.each(fields)("$name updates immediately and rolls back on request failure", async (field) => {
    const previous = field.value();
    const save = deferred();
    requests[field.request].mockReturnValue(save.promise);
    let result: Promise<boolean> | void;
    await act(async () => {
      result = field.change();
    });
    expect(field.value()).not.toEqual(previous);
    await act(async () => {
      save.reject(new Error("Save failed"));
      expect(await result).toBe(false);
    });
    expect(field.value()).toEqual(previous);
    expect(client.getQueryState(Api.projects.getQueryKey({ id: "project-1" }))?.isInvalidated).toBe(false);
  });

  it.each(fields.filter((field) => field.name !== "description"))(
    "$name rolls back an explicit unsuccessful response",
    async (field) => {
      const previous = field.value();
      requests[field.request].mockResolvedValue({ success: false });
      await act(async () => {
        expect(await field.change()).toBe(false);
      });
      expect(field.value()).toEqual(previous);
      expect(client.getQueryState(Api.projects.getQueryKey({ id: "project-1" }))?.isInvalidated).toBe(false);
    },
  );

  it("deletes, invalidates the project query cache, and navigates only after success", async () => {
    const save = deferred();
    requests.deleteMutationOptions.mockReturnValue(save.promise);
    let result: ReturnType<ProjectPage.Props["onProjectDelete"]>;
    await act(async () => {
      result = mockProps.onProjectDelete();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
    await act(async () => {
      save.resolve({ project: { id: "project-1" } });
      expect(await result).toEqual({ success: true });
    });
    expect(client.getQueryState(Api.projects.getQueryKey({ id: "project-1" }))?.isInvalidated).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith("/homePath/");
  });

  it("keeps the project open when deletion fails", async () => {
    requests.deleteMutationOptions.mockRejectedValue(new Error("Delete failed"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      expect(await mockProps.onProjectDelete()).toEqual({ success: false });
    });
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(client.getQueryState(Api.projects.getQueryKey({ id: "project-1" }))?.isInvalidated).toBe(false);
    expect(showErrorToast).toHaveBeenCalled();
  });
});
