import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import i18n, { applyLanguage } from "@/i18n";
import { resolveEffectiveLanguage } from "@/i18n/languages";
import type { Activity } from "@/models/activities";
import type { ActivityContentTaskAssigneeUpdating, Person } from "@/api";
import { usePaths } from "@/routes/paths";
import Handler from ".";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({ projectPath: (id: string) => `/projects/${id}`, taskPath: (id: string) => `/tasks/${id}` }),
}));

const portuguese = { ...i18n.getResourceBundle("pt-BR", "translation") };

function person(id: string, fullName: string): Person {
  return {
    __typename: "person",
    id,
    fullName,
    title: "Designer",
    avatarUrl: null,
    email: `${id}@example.com`,
    type: "human",
  };
}

function activity(count: number): Activity {
  // Multi-assignee payloads can omit the legacy oldAssignee/newAssignee fields.
  const content: Omit<ActivityContentTaskAssigneeUpdating, "oldAssignee" | "newAssignee"> = {
    __typename: "activity_content_task_assignee_updating",
    project: {
      __typename: "project",
      id: "project",
      name: "Website",
      status: "active",
      successStatus: "achieved",
      goalId: "goal",
      spaceId: "space",
    },
    space: { __typename: "space", id: "space", name: "Product" },
    task: { __typename: "task", id: "task", name: "Write copy", type: "project" },
    addedAssignees: Array.from({ length: count }, (_, index) => person(`person-${index}`, `Person ${index + 1}`)),
    removedAssignees: [],
  };
  return {
    __typename: "activity",
    id: "activity",
    action: "task_assignee_updating",
    insertedAt: "2026-09-29T12:00:00Z",
    author: person("author", "Alex Rivera"),
    content: content as ActivityContentTaskAssigneeUpdating,
  };
}

function title(count: number, page = "project") {
  return renderToStaticMarkup(<>{Handler.FeedItemTitle({ activity: activity(count), page, paths: usePaths() })}</>);
}

afterEach(async () => {
  i18n.removeResourceBundle("pt-BR", "translation");
  i18n.addResourceBundle("pt-BR", "translation", portuguese);
  await applyLanguage("en");
});

const cases = [
  [0, "Alex updated assignees on the task", 'Task "Write copy" was unassigned'],
  [1, "Alex assigned to Person 1 the task", 'Task "Write copy" was assigned to Person 1'],
  [3, "Alex assigned 3 people to the task", 'Task "Write copy" was updated with new assignees'],
] as const;

describe.each([false, true])("saved Portuguese preference (flag: %s)", (enabled) => {
  it.each(cases)("preserves zero/single/multiple-assignee wording (%i)", async (count, prefix, notification) => {
    i18n.removeResourceBundle("pt-BR", "translation");
    await applyLanguage(resolveEffectiveLanguage("pt-BR", enabled));
    expect(title(count)).toBe(`${prefix} <a href="/tasks/task">Write copy</a>`);
    expect(title(count, "feed")).toBe(
      `${prefix} <a href="/tasks/task">Write copy</a> in <a href="/projects/project">Website</a>`,
    );
    expect(Handler.NotificationTitle({ activity: activity(count) })).toBe(notification);
  });
});

it("substitutes the complete counted sentence, allowing links to move", async () => {
  i18n.addResourceBundle(
    "pt-BR",
    "translation",
    {
      "{{author}} assigned {{count}} person to the task <task>{{taskName}}</task> in <location>{{locationName}}</location>_other":
        "<location>{{locationName}}</location>: <task>{{taskName}}</task> — {{count}} PEOPLE BY {{author}}",
    },
    true,
    true,
  );
  await applyLanguage("pt-BR");
  expect(title(3, "feed")).toBe(
    '<a href="/projects/project">Website</a>: <a href="/tasks/task">Write copy</a> — 3 PEOPLE BY Alex',
  );
});
