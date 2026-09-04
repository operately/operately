import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ActivityHandler, { DISPLAYED_IN_FEED } from "..";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

describe("company_member_restoring activities", () => {
  const activity: any = {
    action: "company_member_restoring",
    author: { fullName: "Jo Smith" },
    content: {
      person: { id: "person-1", fullName: "Alex Rivera" },
    },
  };

  it("renders the restored member in the feed", () => {
    const title = renderToStaticMarkup(<>{ActivityHandler.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(DISPLAYED_IN_FEED).toContain("company_member_restoring");
    expect(title).toContain("Jo restored Alex");
    expect(title).toContain("account");
  });

  it("renders without crashing when the restored person is missing", () => {
    const activityWithoutPerson = { ...activity, content: { person: null } };
    const title = renderToStaticMarkup(
      <>{ActivityHandler.FeedItemTitle({ activity: activityWithoutPerson, page: "feed" })}</>,
    );

    expect(title).toContain("Jo restored a member");
    expect(title).toContain("account");
  });
});
