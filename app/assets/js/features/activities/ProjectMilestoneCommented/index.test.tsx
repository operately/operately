/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { testCompactHandler } from "../activityHandlerTestSupport";
import Handler from ".";
import React from "react";
import { aggregateConsecutiveFeedActivities } from "@/models/activities";
import { feedTestActivity, feedTestPaths, renderFeedTest } from "../testSupport";
testCompactHandler(Handler, "project_milestone_commented");

test.each(["none", "complete", "reopen"])(
  "keeps %s comments with explanations standalone and displays their summaries",
  async (commentAction) => {
    const content = JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Written explanation" }] }],
    });
    const batch = [0, 1].map((index) =>
      feedTestActivity("project_milestone_commented", index, {
        commentAction,
        comment: { id: `comment-${index}`, content },
      }),
    );
    expect(aggregateConsecutiveFeedActivities(batch)).toHaveLength(2);
    const view = await renderFeedTest(
      <>
        {Handler.FeedItemTitle({ activity: batch[0]!, page: "project", paths: feedTestPaths })}
        {Handler.FeedItemContent({ activity: batch[0]!, page: "project", paths: feedTestPaths })}
      </>,
    );
    try {
      expect(view.container.querySelector("[data-test-id=activity-resource-toggle]")).toBeNull();
      expect(view.container.textContent).toContain("Written explanation");
    } finally {
      await view.cleanup();
    }
  },
);

test("reopening groups remain reopening and use milestone destinations", async () => {
  const batch = [0, 1, 2, 3].map((index) =>
    feedTestActivity("project_milestone_commented", index, { commentAction: "reopen" }),
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
    expect(view.container.textContent).toContain("reopened");
    expect(view.container.querySelectorAll('a[href^="/milestones/"]')).toHaveLength(3);
    await view.toggle();
    expect(view.container.querySelectorAll('a[href^="/milestones/"]')).toHaveLength(4);
  } finally {
    await view.cleanup();
  }
});
