/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { aggregateConsecutiveFeedActivities, type Activity } from "@/models/activities";
import Handler from ".";
import { usePaths } from "@/routes/paths";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));
jest.mock("@/contexts/TimezoneContext", () => ({ useLocale: () => "en" }));
jest.mock("@/routes/paths", () => ({
  usePaths: () => {
    // Preserve a real hook so changing the number of link-helper calls fails.
    const React = jest.requireActual("react");
    return React.useMemo(
      () => ({
        projectPath: (id: string) => `/projects/${id}`,
        spacePath: (id: string) => `/spaces/${id}`,
        taskPath: (id: string) => `/tasks/${id}`,
        spaceKanbanPath: (id: string, { taskId }: { taskId: string }) => `/spaces/${id}/kanban?taskId=${taskId}`,
      }),
      [],
    );
  },
}));

function activity(id: string, inProject: boolean, hasTask = true): Activity {
  return {
    __typename: "activity",
    id,
    action: "task_status_updating",
    author: {
      __typename: "person",
      id: "author",
      fullName: "Alex Smith",
      title: "Designer",
      avatarUrl: null,
      email: "alex@example.com",
      type: "human",
    },
    insertedAt: "2026-09-09T12:00:00Z",
    content: {
      __typename: "activity_content_task_status_updating",
      project: inProject
        ? {
            __typename: "project",
            id: "project",
            name: "Project",
            status: "active",
            successStatus: "achieved",
            goalId: "goal",
            spaceId: "space",
          }
        : null,
      space: { __typename: "space", id: "space", name: "Space" },
      task: hasTask ? { __typename: "task", id, name: id, type: inProject ? "project" : "space" } : null,
      name: id,
      oldStatus: {
        __typename: "task_status",
        id: "todo",
        label: "Todo",
        color: "gray",
        index: 0,
        value: "todo",
        closed: false,
      },
      newStatus: {
        __typename: "task_status",
        id: "done",
        label: "Done",
        color: "green",
        index: 1,
        value: "done",
        closed: true,
      },
    },
  };
}

for (const inProject of [true, false]) {
  describe(inProject ? "project task" : "space task", () => {
    let container: HTMLDivElement;
    let root: ReturnType<typeof createRoot>;
    beforeEach(() => {
      (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
      container = document.createElement("div");
      root = createRoot(container);
    });
    afterEach(async () => {
      await act(async () => root.unmount());
    });

    function Title({ item }: { item: Activity }) {
      const paths = usePaths();
      return <Handler.FeedItemTitle activity={item} page="space" paths={paths} />;
    }

    async function render(item: Activity) {
      await act(async () => {
        root.render(<Title item={item} />);
      });
    }

    function taskLinks() {
      return Array.from(container.querySelectorAll("a"))
        .map((link) => link.getAttribute("href"))
        .filter((href) => href?.startsWith("/tasks/") || href?.includes("taskId="));
    }

    const taskPath = (id: string) => (inProject ? `/tasks/${id}` : `/spaces/space/kanban?taskId=${id}`);

    it("keeps rendering when pagination aggregates a row and deletion separates it again", async () => {
      const first = activity("first", inProject);
      const second = activity("second", inProject);
      await render(first);
      expect(taskLinks()).toEqual([taskPath("first")]);

      const [aggregated] = aggregateConsecutiveFeedActivities([first, second]);
      if (!aggregated) throw new Error("Expected an aggregated activity");
      await render(aggregated);
      expect(taskLinks()).toEqual([taskPath("first"), taskPath("second")]);

      await render(first);
      expect(taskLinks()).toEqual([taskPath("first")]);
    });

    it("keeps rendering when the linked task disappears and returns", async () => {
      await render(activity("first", inProject));
      await render(activity("first", inProject, false));
      expect(taskLinks()).toEqual([]);
      await render(activity("first", inProject));
      expect(taskLinks()).toEqual([taskPath("first")]);
    });
  });
}
