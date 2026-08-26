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

describe("kpi_annotation_added activities", () => {
  const activity: any = {
    action: "kpi_annotation_added",
    author: { fullName: "Jo Smith" },
    content: {
      space: { id: "space-1", name: "General" },
      kpi: { id: "kpi-1", name: "Monthly Recurring Revenue" },
      title: "Launched enterprise plan",
    },
  };

  it("renders and includes the activity in the feed", () => {
    const title = renderToStaticMarkup(<>{ActivityHandler.FeedItemTitle({ activity, page: "feed" })}</>);
    const content = renderToStaticMarkup(<>{ActivityHandler.FeedItemContent({ activity, page: "feed" })}</>);

    expect(DISPLAYED_IN_FEED).toContain("kpi_annotation_added");
    expect(title).toContain("Jo added an annotation to a KPI in the");
    expect(title).toContain('href="/spaces/space-1"');
    expect(content).toContain("Monthly Recurring Revenue: Launched enterprise plan");
    expect(renderToStaticMarkup(<>{ActivityHandler.NotificationTitle({ activity })}</>)).toBe(
      "Annotated KPI: Launched enterprise plan",
    );
    expect(renderToStaticMarkup(<>{ActivityHandler.NotificationLocation({ activity })}</>)).toBe("General");
  });

  it("links to the KPI's own page", () => {
    expect(ActivityHandler.pagePath(paths, activity)).toBe("/spaces/space-1/kpis/kpi-1");
  });
});
