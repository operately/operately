/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import type { Activity } from "@/models/activities";
import Handler from ".";
import { usePaths } from "@/routes/paths";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));
jest.mock("@/contexts/TimezoneContext", () => ({ useLocale: () => "en" }));
jest.mock("@/routes/paths", () => ({
  usePaths: () => {
    const React = jest.requireActual("react");
    return React.useMemo(() => ({ goalPath: (id: string) => `/goals/${id}` }), []);
  },
}));

function activity(hasGoal = true): Activity {
  return {
    __typename: "activity",
    id: "act",
    action: "goal_created",
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
      __typename: "activity_content_goal_created",
      goal: hasGoal
        ? {
            __typename: "goal",
            id: "goal-1",
            name: "Ship i18n",
            status: "on_track",
          }
        : null,
    },
  } as Activity;
}

describe("GoalCreated feed title", () => {
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
    return <Handler.FeedItemTitle activity={item} page="feed" paths={paths} />;
  }

  async function render(item: Activity) {
    await act(async () => {
      root.render(<Title item={item} />);
    });
  }

  it("links the goal when it is present", async () => {
    await render(activity());
    expect(container.textContent).toBe("Alex added the Ship i18n goal");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/goals/goal-1");
  });

  it("keeps rendering when the goal is missing", async () => {
    await render(activity(false));
    expect(container.textContent).toBe("Alex added a goal");
    expect(container.querySelector("a")).toBeNull();
  });
});
