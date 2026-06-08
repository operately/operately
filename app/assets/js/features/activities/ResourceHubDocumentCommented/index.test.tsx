import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ResourceHubDocumentCommented from ".";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  Summary: () => null,
}));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    homePath: () => "/",
    projectPath: (id: string) => `/projects/${id}`,
    resourceHubPath: (id: string) => `/hubs/${id}`,
    resourceHubDocumentPath: (id: string) => `/documents/${id}`,
    spacePath: (id: string) => `/spaces/${id}`,
  }),
}));

describe("ResourceHubDocumentCommented", () => {
  it("links the comment verb to the specific comment", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        space: { id: "space-1", name: "General" },
        document: { id: "doc-1", name: "Start Here" },
        comment: { id: "comment-1" },
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubDocumentCommented.FeedItemTitle({ activity, page: "space" })}</>);

    expect(html).toContain('href="/documents/doc-1#comment-1"');
    expect(html).toContain(">commented</a>");
    expect(html).toContain('href="/documents/doc-1">Start Here</a>');
  });

  it("renders project document comments without requiring a space", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        project: { id: "project-1", name: "Launch" },
        resourceHub: { id: "hub-1", name: "Documents & Files" },
        document: { id: "doc-1", name: "Project Brief" },
        comment: { id: "comment-1" },
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubDocumentCommented.FeedItemTitle({ activity, page: "project" })}</>);

    expect(html).toContain('href="/documents/doc-1#comment-1"');
    expect(html).toContain('href="/documents/doc-1">Project Brief</a>');
    expect(html).not.toContain("/spaces/");
  });
});
