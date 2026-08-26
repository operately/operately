import Api, { Person } from "@/api";
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

const createMilestoneComment = jest.spyOn(Api.projects, "createMilestoneComment");

test("removes the optimistic status activity when the request fails", async () => {
  let rejectRequest: (error: Error) => void = () => {};
  createMilestoneComment.mockReturnValue(
    new Promise((_resolve, reject) => {
      rejectRequest = reject;
    }),
  );

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
  let comments: Array<Timeline.Comment | Timeline.MilestoneActivity> = [];
  const setComments: React.Dispatch<React.SetStateAction<typeof comments>> = (update) => {
    comments = typeof update === "function" ? update(comments) : update;
  };

  const updatePromise = updateMilestoneStatus({
    paths,
    milestone,
    me: currentPerson,
    setComments,
    nextStatus: "done",
    resolution: { action: "move_to_no_milestone" },
  });

  expect(comments).toHaveLength(1);

  rejectRequest(new Error("Request failed"));
  await expect(updatePromise).rejects.toThrow("Request failed");

  expect(comments).toEqual([]);
});
