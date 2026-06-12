import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ResourceHubDocumentCommented from "./ResourceHubDocumentCommented";
import ResourceHubFileCreated from "./ResourceHubFileCreated";
import ResourceHubLinkCreated from "./ResourceHubLinkCreated";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  Summary: () => null,
}));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    homePath: () => "/home",
    projectPath: (id: string) => `/projects/${id}`,
    resourceHubDocumentPath: (id: string) => `/documents/${id}`,
    resourceHubFilePath: (id: string) => `/files/${id}`,
    resourceHubFolderPath: (id: string) => `/folders/${id}`,
    resourceHubLinkPath: (id: string) => `/links/${id}`,
    resourceHubPath: (id: string) => `/resource-hubs/${id}`,
    spacePath: (id: string) => `/spaces/${id}`,
  }),
}));

describe("resource hub activity parent-aware rendering", () => {
  it("renders project-backed document comments under the project", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        project: { id: "project-1", name: "Apollo" },
        space: { id: "space-1", name: "General" },
        resourceHub: { id: "hub-1", name: "Hub" },
        document: { id: "doc-1", name: "Start Here" },
        comment: { id: "comment-1" },
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubDocumentCommented.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(html).toContain('href="/projects/project-1"');
    expect(html).toContain(">Apollo</a> project");
    expect(html).not.toContain("space");
  });

  it("omits missing parent phrasing for document comments", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        resourceHub: { id: "hub-1", name: "Hub" },
        document: { id: "doc-1", name: "Start Here" },
        comment: { id: "comment-1" },
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubDocumentCommented.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(html).not.toContain("in the");
    expect(html).not.toContain("project");
    expect(html).not.toContain("space");
  });

  it("renders project-backed file creation under the project", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        project: { id: "project-1", name: "Apollo" },
        space: { id: "space-1", name: "General" },
        resourceHub: { id: "hub-1", name: "Hub" },
        files: [{ id: "file-1", name: "Readme.pdf" }],
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubFileCreated.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(html).toContain('href="/projects/project-1"');
    expect(html).toContain(">Apollo</a> project");
    expect(html).not.toContain("space");
  });

  it("renders project-backed link creation under the project", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        project: { id: "project-1", name: "Apollo" },
        space: { id: "space-1", name: "General" },
        resourceHub: { id: "hub-1", name: "Hub" },
        link: { id: "link-1", name: "Spec" },
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubLinkCreated.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(html).toContain('href="/projects/project-1"');
    expect(html).toContain(">Apollo</a> project");
    expect(html).not.toContain("space");
  });
});
