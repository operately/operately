/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { aggregateConsecutiveFeedActivities, type Activity } from "@/models/activities";
import type { ActivityContentTaskNameUpdating } from "@/api";
import i18n, { applyLanguage } from "@/i18n";
import Handler from ".";
import { usePaths } from "@/routes/paths";
import { MemoryRouter } from "react-router";

jest.mock("turboui", () => ({
  ...jest.requireActual("turboui"),
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
    action: "task_name_updating",
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
      __typename: "activity_content_task_name_updating",
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
      oldName: "Old name",
      newName: id,
    },
  } as Activity;
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
        root.render(
          <MemoryRouter>
            <Title item={item} />
          </MemoryRouter>,
        );
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

      const extended = aggregateConsecutiveFeedActivities([
        first,
        second,
        activity("third", inProject),
        activity("fourth", inProject),
        activity("fifth", inProject),
      ])[0];
      if (!extended) throw new Error("Expected an extended aggregate");
      await render(extended);
      expect(taskLinks()).toEqual([taskPath("first"), taskPath("second"), taskPath("third")]);
      expect(container.querySelector("button")?.textContent).toBe("Show 2 more tasks");

      await render(aggregated);
      expect(taskLinks()).toEqual([taskPath("first"), taskPath("second")]);
      expect(container.querySelector("button")).toBeNull();

      await render(first);
      expect(taskLinks()).toEqual([taskPath("first")]);
    });

    it("counts distinct renderable tasks in chronological order", async () => {
      const first = activity("first", inProject);
      first.insertedAt = "2026-09-09T11:59:00Z";
      const duplicate = activity("duplicate", inProject);
      const duplicateContent = duplicate.content as ActivityContentTaskNameUpdating;
      duplicateContent.task = (first.content as ActivityContentTaskNameUpdating).task;
      const missingLocation = activity("missing-location", false);
      (missingLocation.content as ActivityContentTaskNameUpdating).space.id = "";
      const items = [
        activity("second", inProject),
        first,
        duplicate,
        activity("missing-task", inProject, false),
        missingLocation,
        activity("third", inProject),
        activity("fourth", inProject),
      ];
      // Use real aggregation for the valid batch; missing resources can occur in an existing aggregate.
      const aggregated = aggregateConsecutiveFeedActivities(items.filter((item) => item !== missingLocation))[0];
      if (!aggregated) throw new Error("Expected an aggregated activity");
      aggregated.aggregatedActivities?.push(missingLocation);
      await render(aggregated);
      expect(taskLinks()).toEqual([taskPath("first"), taskPath("second"), taskPath("third")]);
      expect(container.querySelector("button")?.textContent).toBe("Show 1 more task");
      await act(async () => container.querySelector("button")?.click());
      expect(taskLinks()).toEqual([taskPath("first"), taskPath("second"), taskPath("third"), taskPath("fourth")]);
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

describe("catalog presentation", () => {
  const portuguese = { ...i18n.getResourceBundle("pt-BR", "translation") };
  afterEach(async () => {
    i18n.removeResourceBundle("pt-BR", "translation");
    i18n.addResourceBundle("pt-BR", "translation", portuguese, true, true);
    await applyLanguage("en");
  });

  function renamedActivity() {
    const item = activity("task-1", true);
    const content = item.content as ActivityContentTaskNameUpdating;
    content.newName = "Research & development";
    return item;
  }

  function Title({ item, page }: { item: Activity; page: "project" | "feed" }) {
    const paths = usePaths();
    return <Handler.FeedItemTitle activity={item} page={page} paths={paths} />;
  }

  async function renderTitle(item: Activity, page: "project" | "feed") {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    const root = createRoot(container);
    try {
      await act(async () =>
        root.render(
          <MemoryRouter>
            <Title item={item} page={page} />
          </MemoryRouter>,
        ),
      );
      return container.innerHTML;
    } finally {
      await act(async () => root.unmount());
    }
  }

  test("preserves English copy, links and names", async () => {
    await applyLanguage("en");
    const item = renamedActivity();
    expect(await renderTitle(item, "project")).toBe(
      'Alex renamed task to <a href="/tasks/task-1">Research &amp; development</a>',
    );
    expect(Handler.NotificationTitle({ activity: item })).toBe(
      'Task "Old name" was renamed to "Research & development"',
    );
  });

  test("preserves Portuguese copy, links and names", async () => {
    await applyLanguage("pt-BR");
    const item = renamedActivity();
    expect(await renderTitle(item, "project")).toBe(
      'Alex renomeou a tarefa para <a href="/tasks/task-1">Research &amp; development</a>',
    );
    expect(Handler.NotificationTitle({ activity: item })).toBe(
      'A tarefa "Old name" foi renomeada para "Research & development"',
    );
  });

  test("translates the remaining-task count with singular and plural forms", async () => {
    await applyLanguage("pt-BR");
    for (const count of [4, 5]) {
      const item = aggregateConsecutiveFeedActivities(
        Array.from({ length: count }, (_, index) => activity(`task-${index}`, true)),
      )[0];
      if (!item) throw new Error("Expected an aggregate");
      const markup = await renderTitle(item, "project");
      expect(markup).toContain(count === 4 ? "Mostrar mais 1 tarefa" : "Mostrar mais 2 tarefas");
      expect(markup).toContain('aria-expanded="false"');
    }
  });

  test("translates complete sentences at render time without modifying stored payloads", async () => {
    const item = renamedActivity();
    const before = JSON.stringify(item);
    i18n.addResourceBundle(
      "pt-BR",
      "translation",
      {
        "{{author}} renamed task to <task>{{newName}}</task> in <location>{{locationName}}</location>":
          "Em <location>{{locationName}}</location>, <task>{{newName}}</task> — alteração por {{author}}",
        'Task "{{oldName}}" was renamed to "{{newName}}"': 'Novo nome: "{{newName}}" (antes: "{{oldName}}")',
      },
      true,
      true,
    );
    await applyLanguage("pt-BR");
    expect(await renderTitle(item, "feed")).toBe(
      'Em <a href="/projects/project">Project</a>, <a href="/tasks/task-1">Research &amp; development</a> — alteração por Alex',
    );
    expect(Handler.NotificationTitle({ activity: item })).toBe(
      'Novo nome: "Research & development" (antes: "Old name")',
    );
    expect(JSON.stringify(item)).toBe(before);
  });
});
