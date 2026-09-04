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
  compareIds: (a?: string | null, b?: string | null) => Boolean(a) && Boolean(b) && a === b,
}));

const alex = {
  personId: "person-1",
  person: { id: "person-1", fullName: "Alex Rivera" },
  role: "contributor",
  permissions: 70,
};

const sam = {
  personId: "person-2",
  person: { id: "person-2", fullName: "Sam Lee" },
  role: "champion",
  permissions: 100,
};

const project = { id: "project-1", name: "Website Redesign" };

function activity(content: Record<string, unknown>) {
  return {
    action: "project_contributor_edited",
    author: { fullName: "Jo Smith" },
    content: { project, ...content },
  } as any;
}

function renderFeedItem(activity: any, page: "feed" | "project" = "feed") {
  return {
    title: renderToStaticMarkup(<>{ActivityHandler.FeedItemTitle({ activity, page })}</>),
    content: renderToStaticMarkup(<>{ActivityHandler.FeedItemContent({ activity, page })}</>),
  };
}

describe("project_contributor_edited activities", () => {
  it("is displayed in the feed", () => {
    expect(DISPLAYED_IN_FEED).toContain("project_contributor_edited");
  });

  describe("when the contributor person changes", () => {
    const personChanged = activity({
      previousContributor: { ...alex, role: "champion", permissions: 100 },
      updatedContributor: sam,
    });

    it("renders the new person in the feed", () => {
      const { title, content } = renderFeedItem(personChanged);

      expect(title).toContain("Jo set Sam as the new champion on the");
      expect(title).toContain("Website Redesign");
      expect(title).toContain('href="/projects/project-1"');
      expect(content).toContain("The previous champion Alex is now a champion");
    });

    it("omits the project name on the project page", () => {
      const { title } = renderFeedItem(personChanged, "project");

      expect(title).toContain("Jo set Sam as the new champion");
      expect(title).not.toContain("Website Redesign");
    });

    it("falls back when the project is missing", () => {
      const { title } = renderFeedItem(
        activity({
          project: null,
          previousContributor: alex,
          updatedContributor: sam,
        }),
      );

      expect(title).toContain("Jo set Sam as the new champion on a project");
    });

    it("falls back when both people are missing", () => {
      const { title, content } = renderFeedItem(
        activity({
          previousContributor: { ...alex, person: null },
          updatedContributor: { ...sam, person: null },
        }),
      );

      expect(title).toContain("Jo set a contributor as the new champion on the");
      expect(content).toContain("The previous champion a contributor is now a contributor");
    });

    it("defaults missing roles to contributor", () => {
      const { title, content } = renderFeedItem(
        activity({
          previousContributor: { ...alex, role: null },
          updatedContributor: { ...sam, role: null },
        }),
      );

      expect(title).toContain("Jo set Sam as the new contributor on the");
      expect(content).toContain("The previous contributor Alex is now a contributor");
    });

    it("detects a person change from personId when person objects are missing", () => {
      const { title } = renderFeedItem(
        activity({
          previousContributor: { personId: "person-1", person: null, role: "champion" },
          updatedContributor: { personId: "person-2", person: null, role: "champion" },
        }),
      );

      expect(title).toContain("Jo set a contributor as the new champion");
    });

    it("detects a person change from person.id when personId is missing", () => {
      const { title } = renderFeedItem(
        activity({
          previousContributor: { personId: null, person: alex.person, role: "champion" },
          updatedContributor: { personId: null, person: sam.person, role: "champion" },
        }),
      );

      expect(title).toContain("Jo set Sam as the new champion");
    });
  });

  describe("when the contributor role changes", () => {
    const roleChanged = activity({
      previousContributor: alex,
      updatedContributor: { ...alex, role: "reviewer", permissions: 70 },
    });

    it("renders the reassignment in the feed", () => {
      const { title, content } = renderFeedItem(roleChanged);

      expect(title).toContain("Jo reassigned Alex as a reviewer on the");
      expect(title).toContain("Website Redesign");
      expect(content).toContain("Previously Alex was a contributor");
    });

    it("omits the project name on the project page", () => {
      const { title } = renderFeedItem(roleChanged, "project");

      expect(title).toContain("Jo reassigned Alex as a reviewer on the project");
      expect(title).not.toContain("Website Redesign");
    });

    it("falls back when the project is missing", () => {
      const { title } = renderFeedItem(
        activity({
          project: null,
          previousContributor: alex,
          updatedContributor: { ...alex, role: "reviewer" },
        }),
      );

      expect(title).toContain("Jo reassigned Alex as a reviewer on a project");
    });

    it("falls back when the person is missing", () => {
      const { title, content } = renderFeedItem(
        activity({
          previousContributor: { ...alex, person: null },
          updatedContributor: { ...alex, person: null, role: "reviewer" },
        }),
      );

      expect(title).toContain("Jo reassigned a contributor as a reviewer on the");
      expect(content).toContain("Previously a contributor was a contributor");
    });

    it("defaults a missing new role to contributor", () => {
      const { title, content } = renderFeedItem(
        activity({
          previousContributor: { ...alex, role: "champion" },
          updatedContributor: { ...alex, role: null },
        }),
      );

      expect(title).toContain("Jo reassigned Alex as a contributor on the");
      expect(content).toContain("Previously Alex was a champion");
    });
  });

  describe("when the contributor access changes", () => {
    const accessChanged = activity({
      previousContributor: alex,
      updatedContributor: { ...alex, permissions: 100 },
    });

    it("renders the access change in the feed", () => {
      const { title, content } = renderFeedItem(accessChanged);

      expect(title).toContain("Jo edited Alex");
      expect(title).toContain("access on the");
      expect(title).toContain("Website Redesign");
      expect(content).toContain("Alex now has full access on this project");
    });

    it("omits the project name on the project page", () => {
      const { title } = renderFeedItem(accessChanged, "project");

      expect(title).toContain("Jo edited Alex");
      expect(title).toContain("access");
      expect(title).not.toContain("Website Redesign");
    });

    it("falls back when the project is missing", () => {
      const { title } = renderFeedItem(
        activity({
          project: null,
          previousContributor: alex,
          updatedContributor: { ...alex, permissions: 100 },
        }),
      );

      expect(title).toContain("Jo edited Alex");
      expect(title).toContain("access on a project");
    });

    it("falls back when the person is missing", () => {
      const { title, content } = renderFeedItem(
        activity({
          previousContributor: { ...alex, person: null },
          updatedContributor: { ...alex, person: null, permissions: 100 },
        }),
      );

      expect(title).toContain("Jo edited a contributor");
      expect(title).toContain("access on the");
      expect(content).toContain("a contributor now has full access on this project");
    });

    it("treats matching personId as the same person when person objects are missing", () => {
      const { title } = renderFeedItem(
        activity({
          previousContributor: { personId: "person-1", person: null, role: "contributor", permissions: 70 },
          updatedContributor: { personId: "person-1", person: null, role: "contributor", permissions: 100 },
        }),
      );

      expect(title).toContain("Jo edited a contributor");
      expect(title).toContain("access on the");
      expect(title).not.toContain("set a contributor as the new");
    });

    it("describes no access", () => {
      const { content } = renderFeedItem(
        activity({
          previousContributor: alex,
          updatedContributor: { ...alex, permissions: 0 },
        }),
      );

      expect(content).toContain("Alex now has no access on this project");
    });

    it("omits content when the new access level is missing", () => {
      const { title, content } = renderFeedItem(
        activity({
          previousContributor: alex,
          updatedContributor: { ...alex, permissions: null },
        }),
      );

      expect(title).toContain("Jo edited Alex");
      expect(title).toContain("access on the");
      expect(content).toBe("");
    });
  });

  describe("when neither person, role, nor access changes", () => {
    const unchanged = activity({
      previousContributor: alex,
      updatedContributor: { ...alex },
    });

    it("renders a generic role update in the feed", () => {
      const { title, content } = renderFeedItem(unchanged);

      expect(title).toContain("Jo updated Alex");
      expect(title).toContain("role on the");
      expect(title).toContain("Website Redesign");
      expect(content).toBe("");
    });

    it("omits the project name on the project page", () => {
      const { title } = renderFeedItem(unchanged, "project");

      expect(title).toContain("Jo updated Alex");
      expect(title).toContain("role");
      expect(title).not.toContain("Website Redesign");
    });

    it("falls back when the project is missing", () => {
      const { title } = renderFeedItem(
        activity({
          project: null,
          previousContributor: alex,
          updatedContributor: { ...alex },
        }),
      );

      expect(title).toContain("Jo updated Alex");
      expect(title).toContain("role on a project");
    });
  });

  describe("change precedence", () => {
    it("describes a person change even when role and access also change", () => {
      const { title, content } = renderFeedItem(
        activity({
          previousContributor: alex,
          updatedContributor: sam,
        }),
      );

      expect(title).toContain("Jo set Sam as the new champion");
      expect(content).toContain("The previous champion Alex is now a contributor");
      expect(title).not.toContain("reassigned");
      expect(title).not.toContain("edited");
    });

    it("describes a role change even when access also changes", () => {
      const { title, content } = renderFeedItem(
        activity({
          previousContributor: alex,
          updatedContributor: { ...alex, role: "reviewer", permissions: 100 },
        }),
      );

      expect(title).toContain("Jo reassigned Alex as a reviewer");
      expect(content).toContain("Previously Alex was a contributor");
      expect(title).not.toContain("edited");
      expect(content).not.toContain("full access");
    });
  });
});
