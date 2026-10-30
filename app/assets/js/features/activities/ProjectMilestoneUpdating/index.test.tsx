/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { testCompactHandler } from "../activityHandlerTestSupport";
import Handler from ".";
import React from "react";
import { aggregateConsecutiveFeedActivities } from "@/models/activities";
import { feedTestActivity, feedTestPaths, renderFeedTest } from "../testSupport";
testCompactHandler(Handler, "project_milestone_updating");

test("associates old names and timeframe changes with visible milestones", async () => {
  const batch = [0, 1, 2, 3].map((index) =>
    feedTestActivity("project_milestone_updating", index, {
      oldTimeframe: {
        contextualEndDate: { dateType: "day", value: `2026-09-${10 + index}`, date: `2026-09-${10 + index}` },
      },
      newTimeframe: {
        contextualEndDate: { dateType: "day", value: `2026-09-${20 + index}`, date: `2026-09-${20 + index}` },
      },
    }),
  );
  const view = await renderFeedTest(
    <>
      {Handler.FeedItemTitle({
        activity: aggregateConsecutiveFeedActivities(batch)[0]!,
        page: "project",
        paths: feedTestPaths,
      })}
    </>,
  );
  try {
    expect(view.container.querySelectorAll("[data-test-id=date-field]")).toHaveLength(6);
    expect(view.container.textContent).not.toContain("Old 3");
    await view.toggle();
    const last = view.container.querySelectorAll("[data-test-id=activity-resource-entry]")[3];
    expect(last?.textContent).toContain("Old 3");
    expect(last?.textContent).toContain("New 3");
    expect(last?.textContent).toContain("13");
    expect(last?.textContent).toContain("23");
    expect(last?.querySelectorAll("[data-test-id=date-field]")).toHaveLength(2);
  } finally {
    await view.cleanup();
  }
});
