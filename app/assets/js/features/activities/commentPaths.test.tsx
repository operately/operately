import CommentAdded from "./CommentAdded";
import DiscussionCommentSubmitted from "./DiscussionCommentSubmitted";
import GoalCheckInCommented from "./GoalCheckInCommented";
import ProjectCheckInCommented from "./ProjectCheckInCommented";
import ProjectMilestoneCommented from "./ProjectMilestoneCommented";
import ProjectRetrospectiveCommented from "./ProjectRetrospectiveCommented";
import ProjectTaskCommented from "./ProjectTaskCommented";
import ResourceHubDocumentCommented from "./ResourceHubDocumentCommented";
import ResourceHubFileCommented from "./ResourceHubFileCommented";
import ResourceHubLinkCommented from "./ResourceHubLinkCommented";
import SpaceTaskCommented from "./SpaceTaskCommented";
import { commentPath } from "./feedItemLinks";

const paths: any = {
  discussionPath: (id: string) => `/discussions/${id}`,
  goalActivityPath: (id: string) => `/goal-activities/${id}`,
  goalCheckInPath: (id: string) => `/goal-check-ins/${id}`,
  goalPath: (id: string) => `/goals/${id}`,
  projectActivityPath: (id: string) => `/project-activities/${id}`,
  projectCheckInPath: (id: string) => `/project-check-ins/${id}`,
  projectDiscussionPath: (id: string) => `/project-discussions/${id}`,
  projectMilestonePath: (id: string) => `/milestones/${id}`,
  projectPath: (id: string) => `/projects/${id}`,
  projectRetrospectivePath: (id: string) => `/projects/${id}/retrospective`,
  resourceHubDocumentPath: (id: string) => `/documents/${id}`,
  resourceHubFilePath: (id: string) => `/files/${id}`,
  resourceHubLinkPath: (id: string) => `/links/${id}`,
  resourceHubPath: (id: string) => `/resource-hubs/${id}`,
  spaceKanbanPath: (id: string, opts?: { taskId?: string }) =>
    opts?.taskId ? `/spaces/${id}/kanban?taskId=${opts.taskId}` : `/spaces/${id}/kanban`,
  spacePath: (id: string) => `/spaces/${id}`,
  taskPath: (id: string) => `/tasks/${id}`,
};

describe("comment activity paths", () => {
  it("appends comment anchors consistently", () => {
    expect(commentPath("/documents/doc-1", { id: "comment-1" } as any)).toEqual("/documents/doc-1#comment-1");
    expect(commentPath("/spaces/space-1/kanban?taskId=task-1", { id: "comment-1" } as any)).toEqual(
      "/spaces/space-1/kanban?taskId=task-1#comment-1",
    );
    expect(commentPath("/documents/doc-1", null)).toEqual("/documents/doc-1");
  });

  it("links direct comment activity pages to the comment anchor", () => {
    const comment = { id: "comment-1" };

    expect(
      ResourceHubDocumentCommented.pagePath(paths, {
        content: { document: { id: "doc-1" }, space: { id: "space-1" }, comment },
      } as any),
    ).toEqual("/documents/doc-1#comment-1");

    expect(
      ResourceHubFileCommented.pagePath(paths, {
        content: { file: { id: "file-1" }, space: { id: "space-1" }, comment },
      } as any),
    ).toEqual("/files/file-1#comment-1");

    expect(
      ResourceHubLinkCommented.pagePath(paths, {
        content: { link: { id: "link-1" }, space: { id: "space-1" }, comment },
      } as any),
    ).toEqual("/links/link-1#comment-1");

    expect(
      ProjectMilestoneCommented.pagePath(paths, {
        content: { milestone: { id: "milestone-1" }, project: { id: "project-1" }, comment },
      } as any),
    ).toEqual("/milestones/milestone-1#comment-1");

    expect(
      ProjectCheckInCommented.pagePath(paths, {
        content: { checkIn: { id: "check-in-1" }, comment },
      } as any),
    ).toEqual("/project-check-ins/check-in-1#comment-1");

    expect(
      GoalCheckInCommented.pagePath(paths, {
        content: { update: { id: "check-in-1" }, goal: { id: "goal-1" }, comment },
      } as any),
    ).toEqual("/goal-check-ins/check-in-1#comment-1");

    expect(
      ProjectRetrospectiveCommented.pagePath(paths, {
        content: { project: { id: "project-1" }, comment },
      } as any),
    ).toEqual("/projects/project-1/retrospective#comment-1");

    expect(
      DiscussionCommentSubmitted.pagePath(paths, {
        content: { discussion: { id: "discussion-1" }, space: { id: "space-1" }, comment },
      } as any),
    ).toEqual("/discussions/discussion-1#comment-1");

    expect(
      ProjectTaskCommented.pagePath(paths, {
        content: { task: { id: "task-1" }, project: { id: "project-1" }, comment },
      } as any),
    ).toEqual("/tasks/task-1#comment-1");

    expect(
      SpaceTaskCommented.pagePath(paths, {
        content: { task: { id: "task-1" }, space: { id: "space-1" }, comment },
      } as any),
    ).toEqual("/spaces/space-1/kanban?taskId=task-1#comment-1");
  });

  it("links generic activity-thread comments to the comment anchor", () => {
    const comment = { id: "comment-1" };

    expect(
      CommentAdded.pagePath(paths, {
        content: { activity: { id: "activity-1", action: "goal_closing" }, comment },
      } as any),
    ).toEqual("/goal-activities/activity-1#comment-1");

    expect(
      CommentAdded.pagePath(paths, {
        content: {
          activity: {
            id: "activity-1",
            action: "project_discussion_submitted",
            content: { discussion: { id: "discussion-1" } },
          },
          comment,
        },
      } as any),
    ).toEqual("/project-discussions/discussion-1#comment-1");
  });
});
