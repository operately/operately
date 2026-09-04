import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ActivityHandler, { DISPLAYED_IN_FEED } from "..";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    projectPath: (id: string) => `/projects/${id}`,
  }),
}));

describe("project_contributor_removed activities", () => {
  const activity: any = {
    action: "project_contributor_removed",
    author: { fullName: "Jo Smith" },
    content: {
      person: { id: "person-1", fullName: "Alex Rivera" },
      project: { id: "project-1", name: "Website Redesign" },
    },
  };

  it("renders the removed contributor in the feed", () => {
    const title = renderToStaticMarkup(<>{ActivityHandler.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(DISPLAYED_IN_FEED).toContain("project_contributor_removed");
    expect(title).toContain("Jo removed Alex from the");
    expect(title).toContain("Website Redesign");
    expect(title).toContain('href="/projects/project-1"');
  });

  it("renders without crashing when the removed person is missing", () => {
    const activityWithoutPerson = { ...activity, content: { ...activity.content, person: null } };
    const title = renderToStaticMarkup(
      <>{ActivityHandler.FeedItemTitle({ activity: activityWithoutPerson, page: "feed" })}</>,
    );

    expect(title).toContain("Jo removed a contributor from the");
    expect(title).toContain("Website Redesign");
  });

  it("renders without crashing on the project page when the removed person is missing", () => {
    const activityWithoutPerson = { ...activity, content: { ...activity.content, person: null } };
    const title = renderToStaticMarkup(
      <>{ActivityHandler.FeedItemTitle({ activity: activityWithoutPerson, page: "project" })}</>,
    );

    expect(title).toContain("Jo removed a contributor from the project");
  });

  it("renders without crashing when the project is missing", () => {
    const activityWithoutProject = { ...activity, content: { ...activity.content, project: null } };
    const title = renderToStaticMarkup(
      <>{ActivityHandler.FeedItemTitle({ activity: activityWithoutProject, page: "feed" })}</>,
    );

    expect(title).toContain("Jo removed Alex from a project");
  });
});
