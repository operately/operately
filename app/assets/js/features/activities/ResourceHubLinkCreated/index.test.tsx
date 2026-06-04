import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ResourceHubLinkCreated from ".";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    projectPath: (id: string) => `/projects/${id}`,
    resourceHubLinkPath: (id: string) => `/links/${id}`,
  }),
}));

describe("ResourceHubLinkCreated", () => {
  it("renders project resource hub links without requiring a space", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        project: { id: "project-1", name: "Launch" },
        resourceHub: { id: "hub-1", name: "Docs & Files" },
        link: { id: "link-1", name: "Referral launch brief" },
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubLinkCreated.FeedItemTitle({ activity, page: "project" })}</>);

    expect(html).toContain("Jo");
    expect(html).toContain("added a link:");
    expect(html).toContain('href="/links/link-1">Referral launch brief</a>');
  });
});
