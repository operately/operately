/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Activity } from "@/api";
import { Feed } from ".";

jest.mock("../../../../../turboui/node_modules/react", () => jest.requireActual("react"));
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    profilePath: () => "/person",
    taskPath: (id: string) => `/tasks/${id}`,
    projectMilestonePath: (id: string) => `/milestones/${id}`,
    projectPath: (id: string) => `/projects/${id}`,
  }),
}));
jest.mock("@/contexts/TimezoneContext", () => ({ useLocale: () => "en" }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("@/features/activities", () => ({
  __esModule: true,
  default: {
    FeedItemTitle: (props: { activity: Activity; paths: unknown }) =>
      props.activity.action === "task_status_updating"
        ? React.createElement(jest.requireActual("../activities/taskUpdatedResources").UpdatedTaskList, props)
        : React.createElement(jest.requireActual("../activities/milestoneUpdatedResources").UpdatedMilestoneGroup, {
            ...props,
            page: "project",
          }),
    FeedItemContent: () => null,
    feedItemAlignment: () => "items-start",
  },
}));
jest.mock("./FeedZeroState", () => ({ FeedZeroState: () => null }));
jest.mock("turboui", () => {
  globalThis.TextEncoder = require("util").TextEncoder;
  return {
    InfiniteScroll: jest.requireActual("turboui").InfiniteScroll,
    ContentListSkeleton: jest.requireActual("turboui").ContentListSkeleton,
    ConfirmDialog: () => null,
    DivLink: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Avatar: () => null,
    FormattedTime: () => null,
    ActivityResourceList: jest.requireActual("turboui").ActivityResourceList,
    Link: jest.requireActual("turboui").Link,
  };
});
jest.mock("../../../../../turboui/src/Link", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  ActionLink: ({ onClick, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} aria-expanded={props["aria-expanded"]}>
      {children}
    </button>
  ),
}));

const activity = (id: string): Activity => ({
  __typename: "activity",
  id,
  action: "task_status_updating",
  author: {
    __typename: "person",
    id: "author",
    fullName: "Alex",
    title: "Designer",
    avatarUrl: null,
    email: "alex@example.com",
    type: "human",
  },
  insertedAt: "2026-09-09T12:00:00Z",
  content: {
    __typename: "activity_content_task_status_updating",
    project: {
      __typename: "project",
      id: "project",
      name: "Project",
      status: "active",
      successStatus: "achieved",
      goalId: "goal",
      spaceId: "space",
    },
    space: { __typename: "space", id: "space", name: "Space" },
    task: null,
    name: "Task",
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
});

it("observes the aggregated row containing the latest page's first activity", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const observe = jest.fn();
  const disconnect = jest.fn();
  const originalObserver = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver = jest.fn(() => ({ observe, disconnect })) as unknown as typeof IntersectionObserver;
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    await act(async () => {
      root.render(
        <Feed
          items={[activity("previous-page"), activity("new-page")]}
          page="company"
          pagination={{
            targetActivityId: "new-page",
            observationKey: "page-2",
            hasNextPage: true,
            isFetching: false,
            onLoadMore: async () => {},
          }}
        />,
      );
    });
    expect(container.querySelectorAll("[data-activity-id]")).toHaveLength(1);
    expect(observe.mock.calls[0]?.[0].getAttribute("data-activity-id")).toBe("previous-page");
  } finally {
    await act(async () => root.unmount());
    globalThis.IntersectionObserver = originalObserver;
  }
  expect(disconnect).toHaveBeenCalled();
});

it.each(["task_status_updating", "project_milestone_creation"])(
  "keeps local %s expansion and pagination targeting when another page extends the group",
  async (action) => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const observe = jest.fn();
    const originalObserver = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = jest.fn(() => ({
      observe,
      disconnect: jest.fn(),
    })) as unknown as typeof IntersectionObserver;
    const container = document.createElement("div");
    const root = createRoot(container);
    const items = Array.from(
      { length: 30 },
      (_, index) =>
        ({
          ...activity(`activity-${index}`),
          action,
          content: {
            ...activity("template").content,
            task: { id: `task-${index}`, name: `Task ${index}` },
            milestone: { id: `milestone-${index}`, title: `Milestone ${index}` },
            milestoneName: `Milestone ${index}`,
          },
        }) as unknown as Activity,
    );
    const renderPage = (count: number) => (
      <Feed
        items={items.slice(0, count)}
        page="company"
        pagination={{
          targetActivityId: items[count - 1]?.id,
          observationKey: `page-${count}`,
          hasNextPage: true,
          isFetching: false,
          onLoadMore: async () => {},
        }}
      />
    );
    try {
      await act(async () => root.render(renderPage(4)));
      expect(container.querySelectorAll("a")).toHaveLength(3);
      const toggle = container.querySelector<HTMLButtonElement>("button")!;
      await act(async () => toggle.click());
      expect(container.querySelectorAll("a")).toHaveLength(4);
      await act(async () => root.render(renderPage(30)));
      expect(container.querySelectorAll("[data-activity-id]")).toHaveLength(1);
      expect(container.querySelectorAll("a")).toHaveLength(30);
      expect(container.querySelector("button")).toBe(toggle);
      expect(toggle.getAttribute("aria-expanded")).toBe("true");
      expect(observe.mock.calls.every(([element]) => element.getAttribute("data-activity-id") === "activity-0")).toBe(
        true,
      );
      expect(observe).toHaveBeenCalledTimes(2);
      await act(async () => toggle.click());
      expect(container.querySelectorAll("a")).toHaveLength(3);
      expect(toggle.textContent).toContain("27");
    } finally {
      await act(async () => root.unmount());
      globalThis.IntersectionObserver = originalObserver;
    }
  },
);
