/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { testCompactHandler } from "../activityHandlerTestSupport";
import Handler from ".";
import React from "react";
import { aggregateConsecutiveFeedActivities } from "@/models/activities";
import { feedTestActivity, feedTestPaths, renderFeedTest } from "../testSupport";
testCompactHandler(Handler, "task_archive_updating");

test.each([true, false])("preserves archive state %s for agent space tasks across feed contexts", async (archived) => {
  const batch = [0, 1, 2, 3].map((index) => ({
    ...feedTestActivity("task_archive_updating", index, { archived, project: null }),
    author: { ...feedTestActivity("task_archive_updating", index).author!, type: "agent", fullName: "Automation" },
  }));
  const activity = aggregateConsecutiveFeedActivities(batch)[0]!;
  for (const page of ["company", "space", "profile"]) {
    const view = await renderFeedTest(<>{Handler.FeedItemTitle({ activity, page, paths: feedTestPaths })}</>);
    try {
      expect(view.container.textContent).toContain("Automation");
      expect(view.container.textContent).toContain(archived ? "archived" : "restored");
      expect(view.container.querySelector('a[href="/spaces/space"]') !== null).toBe(page !== "space");
      expect(
        Array.from(view.container.querySelectorAll('a[href*="?task="]')).map((link) => link.getAttribute("href")),
      ).toEqual([0, 1, 2].map((index) => `/spaces/space/tasks?task=task-${index}`));
    } finally {
      await view.cleanup();
    }
  }
});
