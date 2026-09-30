import { usePaths } from "@/routes/paths";
import { applyLanguage } from "@/i18n";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Activity } from "@/models/activities";

import Handler from ".";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  Avatar: ({ person }: { person: { fullName: string } }) => <span>{person.fullName}</span>,
}));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    projectPath: (id: string) => `/projects/${id}`,
  }),
}));

const activity: Activity = {
  __typename: "activity",
  id: "activity-1",
  action: "project_contributors_addition",
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
    __typename: "activity_content_project_contributors_addition",
    project: {
      __typename: "project",
      id: "project-1",
      name: "Website Redesign",
      status: "active",
      successStatus: "achieved",
      goalId: "goal-1",
      spaceId: "space-1",
    },
    contributors: [
      {
        person: {
          __typename: "person",
          id: "p1",
          fullName: "Jordan Smith",
          title: "Designer",
          avatarUrl: null,
          email: "jordan@example.com",
          type: "human",
        },
        responsibility: "Design lead",
      },
      {
        person: {
          __typename: "person",
          id: "p2",
          fullName: "Sam Lee",
          title: "Developer",
          avatarUrl: null,
          email: "sam@example.com",
          type: "human",
        },
        responsibility: "Developer",
      },
    ],
  },
};

describe("project_contributors_addition activities", () => {
  it("renders the feed title without project link on the project page", () => {
    const title = renderToStaticMarkup(<>{Handler.FeedItemTitle({ paths: usePaths(), activity, page: "project" })}</>);

    expect(title).toContain("Alex added new contributors to the project");
    expect(title).not.toContain("Website Redesign");
  });

  it("includes the project link outside the project page", () => {
    const title = renderToStaticMarkup(<>{Handler.FeedItemTitle({ paths: usePaths(), activity, page: "feed" })}</>);

    expect(title).toContain("Alex added new contributors");
    expect(title).toContain("Website Redesign");
    expect(title).toContain('href="/projects/project-1"');
  });

  it("translates the feed title into Portuguese at render time", async () => {
    await applyLanguage("pt-BR");

    try {
      const title = renderToStaticMarkup(<>{Handler.FeedItemTitle({ paths: usePaths(), activity, page: "feed" })}</>);

      expect(title).toContain("Alex adicionou novos contribuidores");
      expect(title).toContain("Website Redesign");
    } finally {
      await applyLanguage("en");
    }
  });

  it("returns the notification title in English", () => {
    expect(Handler.NotificationTitle({ activity })).toBe("Added you as a contributor");
  });

  it("returns the notification title in Portuguese", async () => {
    await applyLanguage("pt-BR");

    try {
      expect(Handler.NotificationTitle({ activity })).toBe("Adicionou você como contribuidor");
    } finally {
      await applyLanguage("en");
    }
  });

  it("returns the project name as notification location", () => {
    expect(Handler.NotificationLocation({ activity })).toBe("Website Redesign");
  });
});
