/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Activity } from "@/api";
import { Feed } from ".";

jest.mock("../../../../../turboui/node_modules/react", () => jest.requireActual("react"));
jest.mock("@/routes/paths", () => ({ usePaths: () => ({ profilePath: () => "/person" }) }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("@/features/activities", () => ({
  __esModule: true,
  default: { FeedItemTitle: () => null, FeedItemContent: () => null, feedItemAlignment: () => "items-start" },
}));
jest.mock("./FeedZeroState", () => ({ FeedZeroState: () => null }));
jest.mock("turboui", () => {
  globalThis.TextEncoder = require("util").TextEncoder;
  return {
    InfiniteScroll: jest.requireActual("turboui/InfiniteScroll").InfiniteScroll,
    ContentListSkeleton: jest.requireActual("turboui/ContentListSkeleton").ContentListSkeleton,
    ConfirmDialog: () => null,
    DivLink: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Avatar: () => null,
    FormattedTime: () => null,
  };
});

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
