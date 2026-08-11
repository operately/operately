import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ActivityHandler, { DISPLAYED_IN_FEED } from "..";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    spacePath: (id: string) => `/spaces/${id}`,
    spaceKpisPath: (id: string) => `/spaces/${id}/kpis`,
  }),
}));

describe("kpi_created activities", () => {
  const activity: any = {
    action: "kpi_created",
    author: { fullName: "Jo Smith" },
    content: {
      space: { id: "space-1", name: "General" },
      kpiName: "Weekly active users",
    },
  };

  it("renders and includes the activity in the feed", () => {
    const title = renderToStaticMarkup(<>{ActivityHandler.FeedItemTitle({ activity, page: "feed" })}</>);
    const content = renderToStaticMarkup(<>{ActivityHandler.FeedItemContent({ activity, page: "feed" })}</>);

    expect(DISPLAYED_IN_FEED).toContain("kpi_created");
    expect(title).toContain("Jo created a KPI in the");
    expect(title).toContain('href="/spaces/space-1"');
    expect(content).toContain("KPI: Weekly active users");
    expect(renderToStaticMarkup(<>{ActivityHandler.NotificationTitle({ activity })}</>)).toBe(
      "Created KPI: Weekly active users",
    );
    expect(renderToStaticMarkup(<>{ActivityHandler.NotificationLocation({ activity })}</>)).toBe("General");
    expect(ActivityHandler.pagePath({ spaceKpisPath: (id: string) => `/spaces/${id}/kpis` } as any, activity)).toBe(
      "/spaces/space-1/kpis",
    );
  });

  it("redirects to home when the activity has no space", () => {
    const activityWithoutSpace = { ...activity, content: { kpiName: "Weekly active users" } };
    const paths = {
      homePath: () => "/acme",
      spaceKpisPath: (id: string) => `/spaces/${id}/kpis`,
    };

    expect(ActivityHandler.pagePath(paths as any, activityWithoutSpace)).toBe("/acme");
  });
});
