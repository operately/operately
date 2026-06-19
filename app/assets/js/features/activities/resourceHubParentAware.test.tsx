import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ResourceHubDocumentCreated from "./ResourceHubDocumentCreated";
import ResourceHubDocumentCommented from "./ResourceHubDocumentCommented";
import ResourceHubDocumentDeleted from "./ResourceHubDocumentDeleted";
import ResourceHubFileCreated from "./ResourceHubFileCreated";
import ResourceHubFileDeleted from "./ResourceHubFileDeleted";
import ResourceHubLinkCreated from "./ResourceHubLinkCreated";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  Summary: () => null,
}));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    goalPath: (id: string, params?: { tab?: string }) => `/goals/${id}${params?.tab ? `?tab=${params.tab}` : ""}`,
    homePath: () => "/home",
    projectPath: (id: string, params?: { tab?: string }) => `/projects/${id}${params?.tab ? `?tab=${params.tab}` : ""}`,
    resourceHubDocumentPath: (id: string) => `/documents/${id}`,
    resourceHubFilePath: (id: string) => `/files/${id}`,
    resourceHubFolderPath: (id: string) => `/folders/${id}`,
    resourceHubLinkPath: (id: string) => `/links/${id}`,
    resourceHubPath: (id: string) => `/resource-hubs/${id}`,
    spacePath: (id: string) => `/spaces/${id}`,
  }),
}));

describe("resource hub activity parent-aware rendering", () => {
  const paths: any = {
    goalPath: (id: string, params?: { tab?: string }) => `/goals/${id}${params?.tab ? `?tab=${params.tab}` : ""}`,
    homePath: () => "/home",
    projectPath: (id: string, params?: { tab?: string }) => `/projects/${id}${params?.tab ? `?tab=${params.tab}` : ""}`,
    resourceHubPath: (id: string) => `/resource-hubs/${id}`,
    spacePath: (id: string) => `/spaces/${id}`,
  };

  it("keeps the existing space-backed document copy", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        space: { id: "space-1", name: "General" },
        document: { id: "doc-1", name: "Start Here" },
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubDocumentCreated.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(html).toContain(
      'created a document in the <a href="/spaces/space-1">General</a> space: <a href="/documents/doc-1">Start Here</a>',
    );
  });

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

  it("renders goal-backed document comments under the goal", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        goal: { id: "goal-1", name: "Company Goal" },
        space: { id: "space-1", name: "General" },
        resourceHub: { id: "hub-1", name: "Hub" },
        document: { id: "doc-1", name: "Start Here" },
        comment: { id: "comment-1" },
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubDocumentCommented.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(html).toContain('href="/goals/goal-1?tab=docs-and-files"');
    expect(html).toContain(">Company Goal</a> goal");
    expect(html).not.toContain(">General</a> space");
  });

  it("suppresses goal parent phrasing on the goal page", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        goal: { id: "goal-1", name: "Company Goal" },
        document: { id: "doc-1", name: "Start Here" },
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubDocumentCreated.FeedItemTitle({ activity, page: "goal" })}</>);

    expect(html).not.toContain('href="/goals/goal-1?tab=docs-and-files"');
    expect(html).not.toContain("in the");
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
        resourceHub: { id: "hub-1", name: "Documents & Files" },
        files: [{ id: "file-1", name: "Readme.pdf" }],
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubFileCreated.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(html).toContain('href="/projects/project-1?tab=docs-and-files"');
    expect(html).toContain(">Documents &amp; Files</a>");
    expect(html).toContain('href="/projects/project-1"');
    expect(html).toContain(">Apollo</a> project");
    expect(html).not.toContain("space");
  });

  it("keeps the existing space-backed file creation copy", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        space: { id: "space-1", name: "General" },
        resourceHub: { id: "hub-1", name: "Documents & Files" },
        files: [{ id: "file-1", name: "Readme.pdf" }],
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubFileCreated.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(html).toContain(
      'added a file to <a href="/resource-hubs/hub-1">Documents &amp; Files</a> in the <a href="/spaces/space-1">General</a> space: <a href="/files/file-1">Readme.pdf</a>',
    );
  });

  it("renders goal-backed file creation under the goal", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        goal: { id: "goal-1", name: "Company Goal" },
        space: { id: "space-1", name: "General" },
        resourceHub: { id: "hub-1", name: "Documents & Files" },
        files: [{ id: "file-1", name: "Readme.pdf" }],
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubFileCreated.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(html).toContain('href="/goals/goal-1?tab=docs-and-files"');
    expect(html).toContain(">Documents &amp; Files</a>");
    expect(html).toContain(">Company Goal</a> goal");
    expect(html).not.toContain(">General</a> space");
  });

  it("renders project-backed link creation under the project", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        project: { id: "project-1", name: "Apollo" },
        space: { id: "space-1", name: "General" },
        resourceHub: { id: "hub-1", name: "Documents & Files" },
        link: { id: "link-1", name: "Spec" },
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubLinkCreated.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(html).toContain('href="/projects/project-1?tab=docs-and-files"');
    expect(html).toContain(">Documents &amp; Files</a>");
    expect(html).toContain('href="/projects/project-1"');
    expect(html).toContain(">Apollo</a> project");
    expect(html).not.toContain("space");
  });

  it("keeps the existing space-backed link creation copy", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        space: { id: "space-1", name: "General" },
        resourceHub: { id: "hub-1", name: "Documents & Files" },
        link: { id: "link-1", name: "Spec" },
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubLinkCreated.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(html).toContain(
      'added a link to <a href="/resource-hubs/hub-1">Documents &amp; Files</a> in the <a href="/spaces/space-1">General</a> space: <a href="/links/link-1">Spec</a>',
    );
  });

  it("renders goal-backed link creation under the goal", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        goal: { id: "goal-1", name: "Company Goal" },
        space: { id: "space-1", name: "General" },
        resourceHub: { id: "hub-1", name: "Documents & Files" },
        link: { id: "link-1", name: "Spec" },
      },
    };

    const html = renderToStaticMarkup(<>{ResourceHubLinkCreated.FeedItemTitle({ activity, page: "feed" })}</>);

    expect(html).toContain('href="/goals/goal-1?tab=docs-and-files"');
    expect(html).toContain(">Documents &amp; Files</a>");
    expect(html).toContain(">Company Goal</a> goal");
    expect(html).not.toContain(">General</a> space");
  });

  it("routes project-backed deleted-resource fallbacks to the project docs tab", () => {
    const activity: any = {
      content: {
        project: { id: "project-1", name: "Apollo" },
        space: { id: "space-1", name: "General" },
        resourceHub: { id: "hub-1", name: "Documents & Files" },
      },
    };

    expect(ResourceHubDocumentDeleted.pagePath(paths, activity)).toBe("/projects/project-1?tab=docs-and-files");
  });

  it("routes goal-backed deleted-resource fallbacks to the goal docs tab", () => {
    const activity: any = {
      content: {
        goal: { id: "goal-1", name: "Company Goal" },
        space: { id: "space-1", name: "General" },
        resourceHub: { id: "hub-1", name: "Documents & Files" },
      },
    };

    expect(ResourceHubFileDeleted.pagePath(paths, activity)).toBe("/goals/goal-1?tab=docs-and-files");
  });

  it("keeps space-backed deleted-resource fallbacks on the hub route", () => {
    const activity: any = {
      content: {
        space: { id: "space-1", name: "General" },
        resourceHub: { id: "hub-1", name: "Documents & Files" },
      },
    };

    expect(ResourceHubDocumentDeleted.pagePath(paths, activity)).toBe("/resource-hubs/hub-1");
  });
});
