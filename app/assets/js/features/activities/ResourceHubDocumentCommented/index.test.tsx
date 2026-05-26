import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ResourceHubDocumentCommented from ".";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  Summary: () => null,
}));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    resourceHubDocumentPath: (id: string) => `/documents/${id}`,
    spacePath: (id: string) => `/spaces/${id}`,
  }),
}));

describe("ResourceHubDocumentCommented", () => {
  it("links the document title to the specific comment", () => {
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
  });
});
