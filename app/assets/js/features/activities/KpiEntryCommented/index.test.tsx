import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ActivityHandler, { DISPLAYED_IN_FEED } from "..";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  Summary: ({ content }: { content: unknown }) => <span>{JSON.stringify(content)}</span>,
}));

jest.mock("@/hooks/useRichEditorHandlers", () => ({
  useRichEditorHandlers: () => ({ mentionedPersonLookup: async () => null }),
}));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    spacePath: (id: string) => `/spaces/${id}`,
    spaceKpisPath: (id: string) => `/spaces/${id}/kpis`,
    spaceKpiPath: (spaceId: string, kpiId: string) => `/spaces/${spaceId}/kpis/${kpiId}`,
    homePath: () => "/acme",
  }),
}));

const paths: any = {
  homePath: () => "/acme",
  spaceKpisPath: (id: string) => `/spaces/${id}/kpis`,
  spaceKpiPath: (spaceId: string, kpiId: string) => `/spaces/${spaceId}/kpis/${kpiId}`,
};

describe("kpi_entry_commented activities", () => {
  const activity: any = {
    action: "kpi_entry_commented",
    author: { fullName: "Jo Smith" },
    content: {
      space: { id: "space-1", name: "General" },
      kpi: { id: "kpi-1", name: "Weekly active users" },
      comment: { id: "comment-1", content: JSON.stringify({ type: "doc", content: [] }) },
    },
  };

  it("renders and includes the activity in the feed", () => {
    const title = renderToStaticMarkup(<>{ActivityHandler.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(DISPLAYED_IN_FEED).toContain("kpi_entry_commented");
    expect(title).toContain("Jo");
    expect(title).toContain("commented");
    expect(title).toContain("Weekly active users");
    expect(title).toContain("update in the");
    expect(renderToStaticMarkup(<>{ActivityHandler.NotificationTitle({ activity })}</>)).toBe("Re: Weekly active users");
    expect(renderToStaticMarkup(<>{ActivityHandler.NotificationLocation({ activity })}</>)).toBe("General");
  });

  it("links to the KPI page", () => {
    expect(ActivityHandler.pagePath(paths, activity)).toBe("/spaces/space-1/kpis/kpi-1#comment-1");
  });
});
