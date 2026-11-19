import { usePaths } from "@/routes/paths";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import i18n, { applyLanguage } from "@/i18n";

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
  const portuguese = { ...i18n.getResourceBundle("pt-BR", "translation") };
  afterEach(async () => {
    i18n.removeResourceBundle("pt-BR", "translation");
    i18n.addResourceBundle("pt-BR", "translation", portuguese);
    await applyLanguage("en");
  });
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
    const title = renderToStaticMarkup(
      <>{ActivityHandler.FeedItemTitle({ paths: usePaths(), activity, page: "feed" })}</>,
    );
    const content = renderToStaticMarkup(
      <>{ActivityHandler.FeedItemContent({ paths: usePaths(), activity, page: "feed" })}</>,
    );

    expect(DISPLAYED_IN_FEED).toContain("kpi_created");
    expect(title).toContain("Jo created a KPI in the");
    expect(title).toContain('href="/spaces/space-1"');
    expect(content).toContain('href="/spaces/space-1/kpis/kpi-1"');
    expect(content).toContain(">Weekly active users</a>");
    expect(renderToStaticMarkup(<>{ActivityHandler.NotificationTitle({ activity })}</>)).toBe(
      "Created KPI: Weekly active users",
    );
    expect(renderToStaticMarkup(<>{ActivityHandler.NotificationLocation({ activity })}</>)).toBe("General");
  });

  it("links to the KPI's own page", () => {
    expect(ActivityHandler.pagePath(paths, activity)).toBe("/spaces/space-1/kpis/kpi-1");
  });

  it("links the KPI name in the space feed too", () => {
    const body = renderToStaticMarkup(
      <>{ActivityHandler.FeedItemContent({ paths: usePaths(), activity, page: "space" })}</>,
    );

    expect(body).toContain('href="/spaces/space-1/kpis/kpi-1"');
    expect(body).toContain(">Weekly active users</a>");
  });

  it.each(["en", "pt-BR"])("keeps English body and notification fallback (language: %s)", async (language) => {
    i18n.removeResourceBundle("pt-BR", "translation");
    await applyLanguage(language);
    const body = renderToStaticMarkup(
      <>{ActivityHandler.FeedItemContent({ paths: usePaths(), activity, page: "feed" })}</>,
    );
    expect(body).toContain("KPI: ");
    expect(body).toContain('href="/spaces/space-1/kpis/kpi-1"');
    expect(body).toContain(">Weekly active users</a>");
    expect(renderToStaticMarkup(<>{ActivityHandler.NotificationTitle({ activity })}</>)).toBe(
      "Created KPI: Weekly active users",
    );
  });

  it("substitutes catalog copy in the body and notification without translating the KPI name", async () => {
    i18n.addResourceBundle(
      "pt-BR",
      "translation",
      {
        "KPI: <kpi>{{kpiName}}</kpi>": "METRIC <kpi>{{kpiName}}</kpi>",
        "Created KPI: {{kpiName}}": "CREATED {{kpiName}}",
      },
      true,
      true,
    );
    await applyLanguage("pt-BR");
    const body = renderToStaticMarkup(
      <>{ActivityHandler.FeedItemContent({ paths: usePaths(), activity, page: "feed" })}</>,
    );
    expect(body).toContain("METRIC ");
    expect(body).toContain('href="/spaces/space-1/kpis/kpi-1"');
    expect(body).toContain(">Weekly active users</a>");
    expect(renderToStaticMarkup(<>{ActivityHandler.NotificationTitle({ activity })}</>)).toBe(
      "CREATED Weekly active users",
    );
  });

  it("renders translated rich text with markup-like KPI names as literal link text", async () => {
    await applyLanguage("fr");
    const activityWithMarkup = {
      ...activity,
      content: { ...activity.content, kpiName: "<b>Revenue</b> & <kpi>growth</kpi>" },
    };
    const body = renderToStaticMarkup(
      <>{ActivityHandler.FeedItemContent({ paths: usePaths(), activity: activityWithMarkup, page: "feed" })}</>,
    );

    expect(body).toContain("KPI : ");
    expect(body).toContain('href="/spaces/space-1/kpis/kpi-1"');
    expect(body).toContain("&lt;b&gt;Revenue&lt;/b&gt; &amp; &lt;kpi&gt;growth&lt;/kpi&gt;</a>");
    expect(body).not.toContain("<b>");
    expect(body.match(/<a /g)).toHaveLength(1);
  });

  it("falls back to the space's KPI list when the activity carries no KPI", () => {
    const activityWithoutKpi = { ...activity, content: { ...activity.content, kpi: null } };

    expect(ActivityHandler.pagePath(paths, activityWithoutKpi)).toBe("/spaces/space-1/kpis");
    expect(
      renderToStaticMarkup(
        <>{ActivityHandler.FeedItemContent({ paths: usePaths(), activity: activityWithoutKpi, page: "feed" })}</>,
      ),
    ).toBe("KPI: Weekly active users");
  });

  it("redirects to home when the activity has no space", () => {
    const activityWithoutSpace = { ...activity, content: { ...activity.content, space: null } };

    expect(ActivityHandler.pagePath(paths, activityWithoutSpace)).toBe("/acme");
    expect(
      renderToStaticMarkup(
        <>{ActivityHandler.FeedItemContent({ paths: usePaths(), activity: activityWithoutSpace, page: "feed" })}</>,
      ),
    ).toBe("KPI: Weekly active users");
  });
});
