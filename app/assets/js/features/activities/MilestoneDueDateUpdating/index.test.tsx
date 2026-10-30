/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { testCompactHandler } from "../activityHandlerTestSupport";
import Handler from ".";
import React from "react";
import { aggregateConsecutiveFeedActivities } from "@/models/activities";
import { feedTestActivity, feedTestPaths, renderFeedTest } from "../testSupport";
testCompactHandler(Handler, "milestone_due_date_updating");

test("retains repeated date transitions on the correct milestone without rendering hidden details", async () => {
  const batch = [0, 1, 2, 3, 4].map((index) =>
    feedTestActivity("milestone_due_date_updating", index, {
      milestone: { id: index === 1 ? "milestone-0" : `milestone-${index}`, title: `Milestone ${index}` },
      oldDueDate: { dateType: "day", value: `2026-09-${10 + index}`, date: `2026-09-${10 + index}` },
      newDueDate: { dateType: "day", value: `2026-09-${20 + index}`, date: `2026-09-${20 + index}` },
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
    const first = view.container.querySelector("[data-test-id=activity-resource-entry]");
    expect(first?.querySelectorAll("[data-test-id=date-field]")).toHaveLength(4);
    expect(first?.textContent).toContain("10");
    expect(first?.textContent).toContain("20");
    expect(first?.textContent).toContain("11");
    expect(first?.textContent).toContain("21");
    expect(view.container.querySelectorAll("[data-test-id=date-field]")).toHaveLength(8);
    await view.toggle();
    const last = view.container.querySelectorAll("[data-test-id=activity-resource-entry]")[3];
    expect(last?.textContent).toContain("14");
    expect(last?.textContent).toContain("24");
    expect(view.container.querySelectorAll("[data-test-id=date-field]")).toHaveLength(10);
  } finally {
    await view.cleanup();
  }
});
