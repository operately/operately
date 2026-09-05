import Api, { Person, ProjectsCreateMilestoneCommentResult } from "@/api";
import { queryClient } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import * as Milestones from "@/models/milestones";
import { Paths } from "@/routes/paths";
import { QueryClientProvider, QueryObserver } from "@tanstack/react-query";
import axios from "axios";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MilestonePage, Timeline } from "turboui";
import MilestonePageModule, { updateMilestoneStatus } from "./index";

jest.mock("axios");
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => jest.fn(),
}));
jest.mock("@/routes/paths", () => ({
  ...jest.requireActual("@/routes/paths"),
  usePaths: () => paths,
}));
jest.mock("turboui", () => ({
  ...jest.requireActual("turboui"),
  MilestonePage: jest.fn(() => null),
}));
jest.mock("@/hooks/useRichEditorHandlers", () => ({ useRichEditorHandlers: () => ({}) }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("@/models/milestones/useMilestones", () => ({ useMilestones: () => ({ milestones: [] }) }));
jest.mock("@/models/projects", () => ({
  ...jest.requireActual("@/models/projects"),
  useProjectSearch: () => ({}),
}));
jest.mock("@/models/spaces", () => ({
  ...jest.requireActual("@/models/spaces"),
  useSpaceSearch: () => ({}),
}));
jest.mock("@/models/tasks", () => ({
  ...jest.requireActual("@/models/tasks"),
  useProjectTasksForTurboUi: () => ({ tasks: [] }),
  useTaskSlideInProps: () => ({}),
  useTaskAssigneeSearch: () => ({}),
}));

const currentPerson: Person = {
  __typename: "person" as const,
  id: "person-1",
  fullName: "John Smith",
  email: "john@example.com",
  title: "",
  avatarUrl: null,
  type: "member",
};

jest.mock("@/contexts/CurrentCompanyContext", () => ({
  useMe: () => currentPerson,
}));

type TurboUiComment = Timeline.Comment | Timeline.MilestoneActivity;

const paths = new Paths({ companyId: "company-1" });
const milestone: Milestones.Milestone = {
  __typename: "milestone",
  id: "milestone-1",
  title: "Test milestone",
  status: "pending",
  insertedAt: "2026-08-26T12:00:00Z",
  timeframe: null,
  completedAt: "",
};

let comments: TurboUiComment[] = [];
const createMilestoneComment = jest.fn<Promise<ProjectsCreateMilestoneCommentResult>, [unknown]>();
const setComments: React.Dispatch<React.SetStateAction<TurboUiComment[]>> = (update) => {
  comments = typeof update === "function" ? update(comments) : update;
};

beforeEach(() => {
  comments = [];
  createMilestoneComment.mockReset();
});

function updateStatus() {
  return updateMilestoneStatus({
    paths,
    milestone,
    me: currentPerson,
    setComments,
    nextStatus: "done",
    resolution: { action: "move_to_no_milestone" },
    createComment: (input) => createMilestoneComment(input),
  });
}

test("removes the optimistic status activity when the request fails", async () => {
  let rejectRequest: (error: Error) => void = () => {};
  createMilestoneComment.mockReturnValue(
    new Promise((_resolve, reject) => {
      rejectRequest = reject;
    }),
  );

  const updatePromise = updateStatus();

  expect(comments).toHaveLength(1);

  rejectRequest(new Error("Request failed"));
  await expect(updatePromise).rejects.toThrow("Request failed");

  expect(comments).toEqual([]);
});

test("keeps concurrent optimistic activities isolated when timestamps match", async () => {
  const rejectRequests: Array<(error: Error) => void> = [];
  createMilestoneComment.mockImplementation(
    () =>
      new Promise<ProjectsCreateMilestoneCommentResult>((_resolve, reject) => {
        rejectRequests.push(reject);
      }),
  );
  const dateNow = jest.spyOn(Date, "now").mockReturnValue(1);

  try {
    const firstUpdate = updateStatus();
    const secondUpdate = updateStatus();

    expect(comments).toHaveLength(2);

    const [rejectFirst, rejectSecond] = rejectRequests;
    if (!rejectFirst || !rejectSecond) throw new Error("Expected two pending milestone requests");

    rejectFirst(new Error("First request failed"));
    await expect(firstUpdate).rejects.toThrow("First request failed");

    expect(comments).toHaveLength(1);

    rejectSecond(new Error("Second request failed"));
    await expect(secondUpdate).rejects.toThrow("Second request failed");

    expect(comments).toEqual([]);
  } finally {
    dateNow.mockRestore();
  }
});

describe("milestone page mutation refreshes", () => {
  let unsubscribeQueries: Array<() => void>;

  beforeEach(async () => {
    queryClient.clear();
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
    jest.mocked(MilestonePage).mockClear();
    jest.mocked(axios.get).mockReset();
    jest.mocked(axios.post).mockReset();
    jest.mocked(axios.get).mockResolvedValue({
      data: {
        milestone: {
          ...milestone,
          completedAt: null,
          project: { id: "project-1", name: "Test project", status: "active" },
          permissions: { canEdit: true, canComment: true },
        },
        tasks: [],
        childrenCount: {},
        activities: [],
      },
    });
    jest.mocked(axios.post).mockResolvedValue({
      data: {
        comment: {
          action: "none",
          comment: { id: "comment-1", insertedAt: "2026-09-04T12:00:00Z", content: "{}" },
        },
      },
    });

    const inputs = await MilestonePageModule.loader({ params: { id: milestone.id }, request: undefined });
    jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);

    // Server rendering captures the bridge callbacks; observers keep its four queries active.
    unsubscribeQueries = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => {
        const observer = new QueryObserver(queryClient, {
          ...query.options,
          queryKey: query.queryKey,
          refetchOnMount: false,
        });
        return observer.subscribe(() => {});
      });
    renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <MilestonePageModule.Page />
      </QueryClientProvider>,
    );
    jest.mocked(axios.get).mockClear();
  });

  afterEach(() => {
    unsubscribeQueries.forEach((unsubscribe) => unsubscribe());
    queryClient.clear();
  });

  const updates: Array<[string, (props: Extract<MilestonePage.Props, { variant: "project" }>) => unknown]> = [
    ["milestone title", (props) => props.onMilestoneTitleChange("Updated milestone")],
    ["description", (props) => props.onDescriptionChange({ type: "doc", content: [] })],
    ["due date", (props) => props.onDueDateChange(null)],
    ["status", (props) => props.onStatusChange("done")],
    ["comment creation", (props) => props.onAddComment(JSON.stringify({ type: "doc", content: [] }))],
    ["project name", (props) => props.updateProjectName("Updated project")],
  ];

  it.each(updates)("refreshes each supporting query once after %s changes", async (_name, update) => {
    const props = jest.mocked(MilestonePage).mock.calls[0]?.[0];
    if (props?.variant !== "project") throw new Error("Expected project Milestone Page to render");

    await update(props);

    expect(axios.post).toHaveBeenCalledTimes(1);
    const requestedPaths = jest.mocked(axios.get).mock.calls.map(([path]) => path);
    expect(requestedPaths.sort()).toEqual([
      "/api/v2/companies/list_activities",
      "/api/v2/projects/count_children",
      "/api/v2/projects/get_milestone",
      "/api/v2/projects/list_milestone_tasks",
    ]);
  });

  it("waits for the refreshed milestone data before completing an edit", async () => {
    const props = jest.mocked(MilestonePage).mock.calls[0]?.[0];
    if (!props) throw new Error("Expected Milestone Page to render");

    const finishRequests: Array<() => void> = [];
    jest
      .mocked(axios.get)
      .mockImplementation(() => new Promise((resolve) => finishRequests.push(() => resolve({ data: {} }))));
    let completed = false;
    const update = Promise.resolve(props.onMilestoneTitleChange("Updated milestone")).then(() => {
      completed = true;
    });

    try {
      await new Promise(setImmediate);
      expect(finishRequests).toHaveLength(4);
      expect(completed).toBe(false);
    } finally {
      jest.mocked(axios.get).mockResolvedValue({ data: {} });
      finishRequests.forEach((finish) => finish());
      await update;
    }
  });
});
