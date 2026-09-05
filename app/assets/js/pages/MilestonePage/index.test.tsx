import { Person, ProjectsCreateMilestoneCommentResult } from "@/api";
import * as Milestones from "@/models/milestones";
import { Paths } from "@/routes/paths";
import type React from "react";
import { Timeline } from "turboui";
import { updateMilestoneStatus } from "./index";

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
