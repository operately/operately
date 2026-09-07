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

describe("kpi_entry_deleted activities", () => {
  const activity: any = {
    action: "kpi_entry_deleted",
    author: { fullName: "Jo Smith" },
    content: {
      space: { id: "space-1", name: "General" },
      kpi: { id: "kpi-1", name: "Monthly Recurring Revenue", unit: "USD" },
      value: 42,
    },
  };

  it("renders and includes the activity in the feed", () => {
    const title = renderToStaticMarkup(<>{ActivityHandler.FeedItemTitle({ activity, page: "feed" })}</>);
    const content = renderToStaticMarkup(<>{ActivityHandler.FeedItemContent({ activity, page: "feed" })}</>);

    expect(DISPLAYED_IN_FEED).toContain("kpi_entry_deleted");
    expect(title).toContain("Jo deleted a KPI update in the");
    expect(title).toContain('href="/spaces/space-1"');
    expect(content).toContain("Monthly Recurring Revenue: 42 USD");
    expect(renderToStaticMarkup(<>{ActivityHandler.NotificationTitle({ activity })}</>)).toBe(
      "Deleted an update from Monthly Recurring Revenue: 42 USD",
    );
    expect(renderToStaticMarkup(<>{ActivityHandler.NotificationLocation({ activity })}</>)).toBe("General");
  });

  it("links to the KPI's own page", () => {
    expect(ActivityHandler.pagePath(paths, activity)).toBe("/spaces/space-1/kpis/kpi-1");
  });
});
