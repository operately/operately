import { usePaths } from "@/routes/paths";
import "@/i18n";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Activity } from "@/models/activities";

import Handler from ".";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    projectPath: (id: string) => `/projects/${id}`,
    spacePath: (id: string) => `/spaces/${id}`,
    taskPath: (id: string) => `/tasks/${id}`,
    spaceKanbanPath: (id: string, { taskId }: { taskId: string }) => `/spaces/${id}/kanban?taskId=${taskId}`,
  }),
}));

const activity: Activity = {
  __typename: "activity",
  id: "activity-1",
  action: "task_adding",
  insertedAt: "2026-09-22T12:00:00Z",
  author: {
    __typename: "person",
    id: "author",
    fullName: "Alex Rivera",
    title: "Designer",
    avatarUrl: null,
    email: "alex@example.com",
    type: "human",
  },
  content: {
    __typename: "activity_content_task_adding",
    project: {
      __typename: "project",
      id: "project-1",
      name: "Website",
      status: "active",
      successStatus: "achieved",
      goalId: "goal",
      spaceId: "space-1",
    },
    space: { __typename: "space", id: "space-1", name: "Product" },
    milestone: null,
    task: { __typename: "task", id: "task-1", name: "Write copy", type: "project" },
    taskName: "Write copy",
  },
};

describe("task_adding activities", () => {
  it("renders the feed title as a complete sentence on the project page", () => {
    const title = renderToStaticMarkup(<>{Handler.FeedItemTitle({ paths: usePaths(), activity, page: "project" })}</>);

    expect(title).toContain("Alex added the task");
    expect(title).toContain("Write copy");
    expect(title).toContain('href="/tasks/task-1"');
    expect(title).not.toContain("in");
  });

  it("includes the project location outside the project page", () => {
    const title = renderToStaticMarkup(<>{Handler.FeedItemTitle({ paths: usePaths(), activity, page: "feed" })}</>);

    expect(title).toContain("Alex added the task");
    expect(title).toContain(" in ");
    expect(title).toContain("Website");
    expect(title).toContain('href="/projects/project-1"');
  });

  it("translates the notification title at render time", () => {
    expect(Handler.NotificationTitle({ activity })).toBe('New task "Write copy" was created');
    expect(Handler.NotificationLocation({ activity })).toBe("Website");
  });
});
