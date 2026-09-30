import { usePaths } from "@/routes/paths";
import { applyLanguage } from "@/i18n";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Activity } from "@/models/activities";

import Handler from ".";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    projectPath: (id: string) => `/projects/${id}`,
  }),
}));

const activityWithChampion: Activity = {
  __typename: "activity",
  id: "activity-1",
  action: "project_champion_updating",
  insertedAt: "2026-09-22T12:00:00Z",
  author: {
    __typename: "person",
    id: "author",
    fullName: "Alex Rivera",
    title: "Designer",
    avatarUrl: null,
    email: "alex@example.com",
    type: "human",
  },
  content: {
    __typename: "activity_content_project_champion_updating",
    company: { __typename: "company", id: "c-1", name: "Acme", setupCompleted: true },
    space: { __typename: "space", id: "s-1", name: "Product" },
    project: {
      __typename: "project",
      id: "project-1",
      name: "Website Redesign",
      status: "active",
      successStatus: "achieved",
      goalId: "goal-1",
      spaceId: "space-1",
    },
    oldChampion: {
      __typename: "person",
      id: "old",
      fullName: "Jane Doe",
      title: "Designer",
      avatarUrl: null,
      email: "jane@example.com",
      type: "human",
    },
    newChampion: {
      __typename: "person",
      id: "new",
      fullName: "Jordan Smith",
      title: "Engineer",
      avatarUrl: null,
      email: "jordan@example.com",
      type: "human",
    },
  },
};

describe("project_champion_updating activities", () => {
  it("renders the feed title with champion name on the project page", () => {
    const title = renderToStaticMarkup(
      <>{Handler.FeedItemTitle({ paths: usePaths(), activity: activityWithChampion, page: "project" })}</>,
    );

    expect(title).toContain("Alex assigned Jordan S. as the champion");
    expect(title).not.toContain("Website");
  });

  it("includes the project link outside the project page", () => {
    const title = renderToStaticMarkup(
      <>{Handler.FeedItemTitle({ paths: usePaths(), activity: activityWithChampion, page: "feed" })}</>,
    );

    expect(title).toContain("Alex assigned Jordan S. as the champion");
    expect(title).toContain("Website Redesign");
    expect(title).toContain('href="/projects/project-1"');
  });

  it("renders the feed title in Portuguese", async () => {
    await applyLanguage("pt-BR");

    try {
      const title = renderToStaticMarkup(
        <>{Handler.FeedItemTitle({ paths: usePaths(), activity: activityWithChampion, page: "feed" })}</>,
      );

      expect(title).toContain("Alex atribuiu Jordan S. como champion");
    } finally {
      await applyLanguage("en");
    }
  });
});
