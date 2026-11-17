import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import i18n from "@/i18n";
import type { Activity } from "@/models/activities";
import type { Paths } from "@/routes/paths";
import ActivityHandler, { DISPLAYED_IN_FEED } from "..";

jest.mock("../../../../../../turboui/node_modules/react", () => jest.requireActual("react"));
jest.mock("../../../../../../turboui/node_modules/react-i18next", () => jest.requireActual("react-i18next"));
jest.mock("../../../../../../turboui/node_modules/i18next", () => jest.requireActual("i18next"));

jest.mock("turboui", () => ({
  i18nOptions: jest.requireActual("../../../../../../turboui/src/i18n").i18nOptions,
  Trans: jest.requireActual("../../../../../../turboui/src/Translate").Trans,
  formatKpiValue: jest.requireActual("../../../../../../turboui/src/SpaceKpisPage/utils").formatValue,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

const paths = {
  homePath: () => "/acme",
  spacePath: (id: string) => `/spaces/${id}`,
  spaceKpisPath: (id: string) => `/spaces/${id}/kpis`,
  spaceKpiPath: (spaceId: string, kpiId: string) => `/spaces/${spaceId}/kpis/${kpiId}`,
} as Paths;

const activity = {
  action: "kpi_entry_logged",
  author: { fullName: "Jo Smith" },
  content: {
    __typename: "activity_content_kpi_entry_logged",
    space: { id: "space-1", name: "General" },
    kpi: { id: "kpi-1", name: "Customer satisfaction", unit: "%" },
    entry: { id: "entry-1" },
    value: 42.5,
    period: "2026-01-01",
  },
} as Activity;

function feedTitle(currentActivity = activity, page = "feed") {
  return renderToStaticMarkup(<ActivityHandler.FeedItemTitle paths={paths} activity={currentActivity} page={page} />);
}

function feedContent(currentActivity = activity) {
  return renderToStaticMarkup(<ActivityHandler.FeedItemContent paths={paths} activity={currentActivity} page="feed" />);
}

function notificationTitle(currentActivity = activity) {
  return renderToStaticMarkup(<ActivityHandler.NotificationTitle activity={currentActivity} />);
}

describe("logged KPI activity presentation", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("registers the handler and renders the notification and feed", () => {
    expect(DISPLAYED_IN_FEED).toContain("kpi_entry_logged");
    expect(feedTitle()).toContain("Jo");
    expect(feedTitle()).toContain('href="/spaces/space-1"');
    expect(feedTitle(activity, "space")).not.toContain("href=");
    expect(feedContent()).toContain("Customer satisfaction");
    expect(feedContent()).toContain("42.5%");
    expect(notificationTitle()).toContain("Customer satisfaction");
    expect(notificationTitle()).toContain("42.5%");
    expect(renderToStaticMarkup(<ActivityHandler.NotificationLocation activity={activity} />)).toBe("General");
    expect(ActivityHandler.pagePath(paths, activity)).toBe("/spaces/space-1/kpis/kpi-1");
  });

  it("falls back to the space KPI list and retains the value when the KPI is unavailable", () => {
    const missingKpi = { ...activity, content: { ...activity.content, kpi: null, entry: null } } as Activity;
    expect(ActivityHandler.pagePath(paths, missingKpi)).toBe("/spaces/space-1/kpis");
    expect(notificationTitle(missingKpi)).toContain("42.5");
    expect(feedContent(missingKpi)).toContain("42.5");
    expect(feedTitle(missingKpi)).toContain('href="/spaces/space-1"');
  });

  it.each(["pt-BR", "de", "ru", "fr", "es"])(
    "uses translated interpolation and localized values in %s",
    async (language) => {
      await i18n.changeLanguage(language);
      const title = notificationTitle();
      expect(title).toContain("42,5%");
      expect(title).toContain("Customer satisfaction");
      expect(title).not.toContain("Recorded");
      expect(title).not.toContain("{{");
      expect(feedContent()).toContain("42,5%");
      expect(feedTitle()).toContain("Jo");
      expect(feedTitle()).toContain("General");
      expect(feedTitle()).not.toContain("recorded a KPI value");
      expect(feedTitle()).toContain('href="/spaces/space-1"');
    },
  );

  it("escapes user-authored names while preserving the space link", () => {
    const namedActivity = {
      ...activity,
      author: { ...activity.author, fullName: "<b>Jo</b> Smith" },
      content: { ...activity.content, space: { id: "space-1", name: "<script>General</script>" } },
    } as Activity;
    const title = feedTitle(namedActivity);
    expect(title).toContain("&lt;b&gt;Jo&lt;/b&gt;");
    expect(title).toContain("&lt;script&gt;General&lt;/script&gt;");
    expect(title).not.toContain("<script>");
    expect(title).toContain('href="/spaces/space-1"');
  });
});
