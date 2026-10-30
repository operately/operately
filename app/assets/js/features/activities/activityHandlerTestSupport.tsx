import React from "react";
import { aggregateConsecutiveFeedActivities } from "@/models/activities";
import { assertPresent } from "@/utils/assertions";
import type { ActivityHandler } from "./interfaces";
import { feedTestActivity, feedTestPaths, renderFeedTest } from "./testSupport";

jest.mock("../../../../../turboui/node_modules/react", () => jest.requireActual("react"));
jest.mock("@/contexts/TimezoneContext", () => ({ useLocale: () => "en" }));
jest.mock("@/hooks/useRichEditorHandlers", () => ({
  useRichEditorHandlers: () => ({ mentionedPersonLookup: () => null }),
}));
jest.mock("../../../../../turboui/src/Link", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  ActionLink: ({ onClick, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} aria-expanded={props["aria-expanded"]} data-test-id="activity-resource-toggle">
      {children}
    </button>
  ),
}));
jest.mock("turboui", () => {
  globalThis.TextEncoder = require("util").TextEncoder;
  return jest.requireActual("turboui");
});

export function testCompactHandler(handler: ActivityHandler, action: string) {
  test.each(["company", "project", "space", "profile"])(
    `${action} keeps author, context, and bounded entries on %s feeds`,
    async (page) => {
      const batch = Array.from({ length: 30 }, (_, index) => feedTestActivity(action, index));
      const activity = aggregateConsecutiveFeedActivities(batch)[0];
      assertPresent(activity, "The batch must produce an aggregated activity");
      const view = await renderFeedTest(<>{handler.FeedItemTitle({ activity, page, paths: feedTestPaths })}</>);
      try {
        expect(view.container.querySelectorAll("[data-test-id=activity-resource-entry]")).toHaveLength(3);
        expect(view.container.textContent).toContain("Alex");
        if (action === "task_moving") {
          expect(view.container.querySelector('a[href="/projects/origin"]')).not.toBeNull();
          expect(view.container.querySelector('a[href="/spaces/destination"]')).not.toBeNull();
        } else {
          expect(view.container.querySelector('a[href="/projects/project"]') !== null).toBe(page !== "project");
        }
        await view.toggle();
        expect(view.container.querySelectorAll("[data-test-id=activity-resource-entry]")).toHaveLength(30);
        if (action === "milestone_title_updating" || action === "project_milestone_updating") {
          const last = view.container.querySelectorAll("[data-test-id=activity-resource-entry]")[29];
          expect(last?.textContent).toContain("Old 29");
          expect(last?.textContent).toContain("New 29");
        }
        await view.toggle();
        expect(view.container.textContent).not.toContain("Old 29");
      } finally {
        await view.cleanup();
      }
    },
  );

  test(`${action} preserves single-activity presentation without a toggle`, async () => {
    const activity = feedTestActivity(action, 0, { task: { id: "task-0", name: "Write copy" } });
    const view = await renderFeedTest(
      <>{handler.FeedItemTitle({ activity, page: "company", paths: feedTestPaths })}</>,
    );
    try {
      expect(view.container.querySelector("button")).toBeNull();
      expect(view.container.textContent).toContain("Alex");
      expect(view.container.querySelector('a[href="/projects/project"]') !== null).toBe(action !== "task_moving");
    } finally {
      await view.cleanup();
    }
  });
}
