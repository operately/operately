import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

jest.mock("../../icons", () => ({
  IconDots: () => <span>dots</span>,
  IconSlash: () => <span>slash</span>,
}));

import { NewResourcePageNavigation } from "./NewResourcePageNavigation";
import { ResourcePageNavigation } from "./ResourcePageNavigation";
import {
  resourceHubDraftsNavigation,
  resourceHubFolderNavigation,
  resourceHubPageNavigation,
  resourceHubParentNavigationItem,
} from "./parentNavigation";

const paths = {
  projectOverviewPath: (id: string) => `/projects/${id}?tab=overview`,
  projectDocsAndFilesPath: (id: string) => `/projects/${id}?tab=docs-and-files`,
  goalOverviewPath: (id: string) => `/goals/${id}?tab=overview`,
  goalDocsAndFilesPath: (id: string) => `/goals/${id}?tab=docs-and-files`,
  spacePath: (id: string) => `/spaces/${id}`,
  projectWorkMapPath: (spaceId: string) => `/spaces/${spaceId}/work-map?tab=projects`,
  goalWorkMapPath: (spaceId: string) => `/spaces/${spaceId}/work-map`,
  resourceHubPath: (id: string) => `/resource-hubs/${id}`,
  resourceHubFolderPath: (id: string) => `/folders/${id}`,
};

describe("resource hub navigation", () => {
  test("builds the parent item for project-backed hubs with the overview path", () => {
    const item = resourceHubParentNavigationItem(
      {
        id: "hub-1",
        name: "Documents & Files",
        project: { id: "project-1", name: "Apollo" },
        space: { id: "space-1", name: "Operations" },
      } as any,
      paths,
    );

    expect(item).toEqual({ to: "/projects/project-1?tab=overview", label: "Apollo" });
  });

  test("builds the parent item for goal-backed hubs with the overview path", () => {
    const item = resourceHubParentNavigationItem(
      {
        id: "hub-1",
        name: "Documents & Files",
        goal: { id: "goal-1", name: "Company Goal" },
        space: { id: "space-1", name: "Operations" },
      } as any,
      paths,
    );

    expect(item).toEqual({ to: "/goals/goal-1?tab=overview", label: "Company Goal" });
  });

  test("falls back to the space parent for space-backed hubs", () => {
    const item = resourceHubParentNavigationItem(
      {
        id: "hub-1",
        name: "Documents & Files",
        space: { id: "space-1", name: "Operations" },
      } as any,
      paths,
    );

    expect(item).toEqual({ to: "/spaces/space-1", label: "Operations" });
  });

  test("keeps the root hub navigation unchanged for space-backed hubs", () => {
    expect(
      resourceHubPageNavigation(
        {
          id: "hub-1",
          name: "Documents & Files",
          space: { id: "space-1", name: "Operations" },
        } as any,
        paths,
      ),
    ).toEqual([{ to: "/spaces/space-1", label: "Operations" }]);
  });

  test("builds root hub navigation for project-backed hubs", () => {
    expect(
      resourceHubPageNavigation(
        {
          id: "hub-1",
          name: "Documents & Files",
          project: { id: "project-1", name: "Apollo" },
          space: { id: "space-1", name: "Operations" },
        } as any,
        paths,
      ),
    ).toEqual([
      { to: "/spaces/space-1", label: "Operations" },
      { to: "/spaces/space-1/work-map?tab=projects", label: "Work Map" },
      { to: "/projects/project-1?tab=overview", label: "Apollo" },
      { to: "/projects/project-1?tab=docs-and-files", label: "Docs & Files" },
    ]);
  });

  test("builds root hub navigation for goal-backed hubs", () => {
    expect(
      resourceHubPageNavigation(
        {
          id: "hub-1",
          name: "Documents & Files",
          goal: { id: "goal-1", name: "Company Goal" },
          space: { id: "space-1", name: "Operations" },
        } as any,
        paths,
      ),
    ).toEqual([
      { to: "/spaces/space-1", label: "Operations" },
      { to: "/spaces/space-1/work-map", label: "Work Map" },
      { to: "/goals/goal-1?tab=overview", label: "Company Goal" },
      { to: "/goals/goal-1?tab=docs-and-files", label: "Docs & Files" },
    ]);
  });

  test("builds drafts navigation for space-backed hubs", () => {
    expect(
      resourceHubDraftsNavigation(
        {
          id: "hub-1",
          name: "Documents & Files",
          space: { id: "space-1", name: "Operations" },
        } as any,
        paths,
      ),
    ).toEqual([
      { to: "/spaces/space-1", label: "Operations" },
      { to: "/resource-hubs/hub-1", label: "Documents & Files" },
    ]);
  });

  test("builds drafts navigation for project-backed hubs", () => {
    expect(
      resourceHubDraftsNavigation(
        {
          id: "hub-1",
          name: "Documents & Files",
          project: { id: "project-1", name: "Apollo" },
          space: { id: "space-1", name: "Operations" },
        } as any,
        paths,
      ),
    ).toEqual([
      { to: "/spaces/space-1", label: "Operations" },
      { to: "/spaces/space-1/work-map?tab=projects", label: "Work Map" },
      { to: "/projects/project-1?tab=overview", label: "Apollo" },
      { to: "/projects/project-1?tab=docs-and-files", label: "Docs & Files" },
    ]);
  });

  test("builds folder navigation for goal-backed hubs", () => {
    expect(
      resourceHubFolderNavigation(
        {
          id: "folder-2",
          name: "Guides",
          pathToFolder: [{ id: "folder-1", name: "Specs" }],
          resourceHub: {
            id: "hub-1",
            name: "Documents & Files",
            goal: { id: "goal-1", name: "Company Goal" },
            space: { id: "space-1", name: "Operations" },
          },
        } as any,
        paths,
      ),
    ).toEqual([
      { to: "/spaces/space-1", label: "Operations" },
      { to: "/spaces/space-1/work-map", label: "Work Map" },
      { to: "/goals/goal-1?tab=overview", label: "Company Goal" },
      { to: "/goals/goal-1?tab=docs-and-files", label: "Docs & Files" },
      { to: "/folders/folder-1", label: "Specs" },
    ]);
  });

  test("renders space-backed resource breadcrumbs", () => {
    renderWithRouter(
      <ResourcePageNavigation
        resource={
          {
            id: "document-1",
            name: "Spec",
            resourceHub: {
              id: "hub-1",
              name: "Documents & Files",
              space: { id: "space-1", name: "Operations" },
            },
            pathToDocument: [{ id: "folder-1", name: "Specs" }],
          } as any
        }
        paths={paths}
      />,
    );

    expectNavigationLinks([
      ["Operations", "/spaces/space-1"],
      ["Documents & Files", "/resource-hubs/hub-1"],
      ["Specs", "/folders/folder-1"],
    ]);
  });

  test("renders project-backed resource breadcrumbs", () => {
    renderWithRouter(
      <ResourcePageNavigation
        resource={
          {
            id: "document-1",
            name: "Spec",
            resourceHub: {
              id: "hub-1",
              name: "Documents & Files",
              project: { id: "project-1", name: "Apollo" },
              space: { id: "space-1", name: "Operations" },
            },
            pathToDocument: [{ id: "folder-1", name: "Specs" }],
          } as any
        }
        paths={paths}
      />,
    );

    expectNavigationLinks([
      ["Operations", "/spaces/space-1"],
      ["Work Map", "/spaces/space-1/work-map?tab=projects"],
      ["Apollo", "/projects/project-1?tab=overview"],
      ["Docs & Files", "/projects/project-1?tab=docs-and-files"],
      ["Specs", "/folders/folder-1"],
    ]);
  });

  test("renders goal-backed resource breadcrumbs", () => {
    renderWithRouter(
      <ResourcePageNavigation
        resource={
          {
            id: "document-1",
            name: "Spec",
            resourceHub: {
              id: "hub-1",
              name: "Documents & Files",
              goal: { id: "goal-1", name: "Company Goal" },
              space: { id: "space-1", name: "Operations" },
            },
            pathToDocument: [{ id: "folder-1", name: "Specs" }],
          } as any
        }
        paths={paths}
      />,
    );

    expectNavigationLinks([
      ["Operations", "/spaces/space-1"],
      ["Work Map", "/spaces/space-1/work-map"],
      ["Company Goal", "/goals/goal-1?tab=overview"],
      ["Docs & Files", "/goals/goal-1?tab=docs-and-files"],
      ["Specs", "/folders/folder-1"],
    ]);
  });

  test("renders project-backed new-resource breadcrumbs", () => {
    renderWithRouter(
      <NewResourcePageNavigation
        resourceHub={
          {
            id: "hub-1",
            name: "Documents & Files",
            project: { id: "project-1", name: "Apollo" },
            space: { id: "space-1", name: "Operations" },
          } as any
        }
        folder={{ id: "folder-1", name: "Specs", pathToFolder: [{ id: "folder-2", name: "Nested" }] } as any}
        paths={paths}
      />,
    );

    expectNavigationLinks([
      ["Operations", "/spaces/space-1"],
      ["Work Map", "/spaces/space-1/work-map?tab=projects"],
      ["Apollo", "/projects/project-1?tab=overview"],
      ["Docs & Files", "/projects/project-1?tab=docs-and-files"],
      ["Nested", "/folders/folder-2"],
    ]);
  });

  test("omits project and goal breadcrumbs when the hub parent is missing", () => {
    renderWithRouter(
      <NewResourcePageNavigation
        resourceHub={{ id: "hub-1", name: "Documents & Files" } as any}
        folder={{ id: "folder-1", name: "Specs", pathToFolder: [{ id: "folder-2", name: "Nested" }] } as any}
        paths={paths}
      />,
    );

    expect(screen.queryByRole("link", { name: "Apollo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Company Goal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Work Map" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Documents & Files" })).toHaveAttribute("href", "/resource-hubs/hub-1");
    expect(screen.getByRole("link", { name: "Nested" })).toHaveAttribute("href", "/folders/folder-2");
  });
});

function renderWithRouter(ui: React.ReactElement) {
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{ui}</MemoryRouter>);
}

function expectNavigationLinks(items: Array<[string, string]>) {
  items.forEach(([name, href]) => {
    expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
  });
}
