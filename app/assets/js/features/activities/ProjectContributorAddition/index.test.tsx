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

describe("project_contributor_addition activities", () => {
  const activity: any = {
    action: "project_contributor_addition",
    author: { fullName: "Jo Smith" },
    content: {
      person: { id: "person-1", fullName: "Alex Rivera" },
      project: { id: "project-1", name: "Website Redesign" },
    },
  };

  it("renders the added contributor in the feed", () => {
    const title = renderToStaticMarkup(<>{ActivityHandler.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(DISPLAYED_IN_FEED).toContain("project_contributor_addition");
    expect(title).toContain("Jo added Alex to the");
    expect(title).toContain("Website Redesign");
    expect(title).toContain('href="/projects/project-1"');
  });

  it("renders without crashing when the added person is missing", () => {
    const activityWithoutPerson = { ...activity, content: { ...activity.content, person: null } };
    const title = renderToStaticMarkup(
      <>{ActivityHandler.FeedItemTitle({ activity: activityWithoutPerson, page: "feed" })}</>,
    );

    expect(title).toContain("Jo added a contributor to the");
    expect(title).toContain("Website Redesign");
  });

  it("renders without crashing on the project page when the added person is missing", () => {
    const activityWithoutPerson = { ...activity, content: { ...activity.content, person: null } };
    const title = renderToStaticMarkup(
      <>{ActivityHandler.FeedItemTitle({ activity: activityWithoutPerson, page: "project" })}</>,
    );

    expect(title).toContain("Jo added a contributor to the project");
  });
});
