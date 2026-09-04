import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ActivityHandler, { DISPLAYED_IN_FEED } from "..";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

describe("company_admin_removed activities", () => {
  const activity: any = {
    action: "company_admin_removed",
    author: { fullName: "Jo Smith" },
    content: {
      person: { id: "person-1", fullName: "Alex Rivera" },
    },
  };

  it("renders the removed admin in the feed", () => {
    const title = renderToStaticMarkup(<>{ActivityHandler.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(DISPLAYED_IN_FEED).toContain("company_admin_removed");
    expect(title).toContain("Jo has revoked Alex");
    expect(title).toContain("admin privileges");
  });

  it("renders without crashing when the removed person is missing", () => {
    const activityWithoutPerson = { ...activity, content: { person: null } };
    const title = renderToStaticMarkup(
      <>{ActivityHandler.FeedItemTitle({ activity: activityWithoutPerson, page: "feed" })}</>,
    );

    expect(title).toContain("Jo has revoked a member");
    expect(title).toContain("admin privileges");
  });
});
