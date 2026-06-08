import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ResourceHubLinkDeleted from ".";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    projectPath: (id: string) => `/projects/${id}`,
    resourceHubPath: (id: string) => `/hubs/${id}`,
    spacePath: (id: string) => `/spaces/${id}`,
  }),
}));

describe("ResourceHubLinkDeleted", () => {
  it("renders project resource hub link deletions without requiring a space", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        project: { id: "project-1", name: "Launch" },
        resourceHub: { id: "hub-1", name: "Documents & Files" },
        link: { id: "link-1", name: "Launch brief" },
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubLinkDeleted.FeedItemTitle({ activity, page: "project" })}</>);

    expect(html).toContain('href="/hubs/hub-1">Docs &amp; Files</a>');
    expect(html).toContain("deleted the &quot;Launch brief&quot; link from");
    expect(html).not.toContain("/spaces/");
  });
});
