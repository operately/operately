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
    spaceKpiPath: (spaceId: string, kpiId: string) => `/spaces/${spaceId}/kpis/${kpiId}`,
  }),
}));

const paths: any = {
  homePath: () => "/acme",
  spaceKpisPath: (id: string) => `/spaces/${id}/kpis`,
  spaceKpiPath: (spaceId: string, kpiId: string) => `/spaces/${spaceId}/kpis/${kpiId}`,
};

describe("kpi_created activities", () => {
  const activity: any = {
    action: "kpi_created",
    author: { fullName: "Jo Smith" },
    content: {
      space: { id: "space-1", name: "General" },
      kpi: { id: "kpi-1" },
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
  });

  it("links to the KPI's own page", () => {
    expect(ActivityHandler.pagePath(paths, activity)).toBe("/spaces/space-1/kpis/kpi-1");
  });

  it("falls back to the space's KPI list when the activity carries no KPI", () => {
    const activityWithoutKpi = { ...activity, content: { ...activity.content, kpi: null } };

    expect(ActivityHandler.pagePath(paths, activityWithoutKpi)).toBe("/spaces/space-1/kpis");
  });

  it("redirects to home when the activity has no space", () => {
    const activityWithoutSpace = { ...activity, content: { kpiName: "Weekly active users" } };

    expect(ActivityHandler.pagePath(paths, activityWithoutSpace)).toBe("/acme");
  });
});
