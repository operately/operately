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
  projectPath: (id: string) => `/projects/${id}?tab=docs-and-files`,
  goalPath: (id: string) => `/goals/${id}`,
  spacePath: (id: string) => `/spaces/${id}`,
  resourceHubPath: (id: string) => `/resource-hubs/${id}`,
  resourceHubFolderPath: (id: string) => `/folders/${id}`,
};

describe("resource hub navigation", () => {
  test("prefers the project parent over the space parent", () => {
    const item = resourceHubParentNavigationItem(
      {
        id: "hub-1",
        name: "Docs",
        project: { id: "project-1", name: "Apollo" },
        space: { id: "space-1", name: "Operations" },
      } as any,
      paths,
    );

    expect(item).toEqual({ to: "/projects/project-1?tab=docs-and-files", label: "Apollo" });
  });

  test("falls back to the space parent when the hub is space-backed", () => {
    const item = resourceHubParentNavigationItem(
      {
        id: "hub-1",
        name: "Docs",
        space: { id: "space-1", name: "Operations" },
      } as any,
      paths,
    );

    expect(item).toEqual({ to: "/spaces/space-1", label: "Operations" });
  });

  test("falls back to the goal parent before the space parent", () => {
    const item = resourceHubParentNavigationItem(
      {
        id: "hub-1",
        name: "Docs",
        goal: { id: "goal-1", name: "Company Goal" },
        space: { id: "space-1", name: "Operations" },
      } as any,
      paths,
    );

    expect(item).toEqual({ to: "/goals/goal-1", label: "Company Goal" });
  });

  test("builds root hub navigation from the parent only", () => {
    expect(
      resourceHubPageNavigation(
        {
          id: "hub-1",
          name: "Docs",
          project: { id: "project-1", name: "Apollo" },
          space: { id: "space-1", name: "Operations" },
        } as any,
        paths,
      ),
    ).toEqual([{ to: "/projects/project-1?tab=docs-and-files", label: "Apollo" }]);
  });

  test("builds root hub navigation for goal-backed hubs", () => {
    expect(
      resourceHubPageNavigation(
        {
          id: "hub-1",
          name: "Docs",
          goal: { id: "goal-1", name: "Company Goal" },
          space: { id: "space-1", name: "Operations" },
        } as any,
        paths,
      ),
    ).toEqual([{ to: "/goals/goal-1", label: "Company Goal" }]);
  });

  test("builds drafts navigation with the parent and hub", () => {
    expect(
      resourceHubDraftsNavigation(
        {
          id: "hub-1",
          name: "Docs",
          space: { id: "space-1", name: "Operations" },
        } as any,
        paths,
      ),
    ).toEqual([
      { to: "/spaces/space-1", label: "Operations" },
      { to: "/resource-hubs/hub-1", label: "Docs" },
    ]);
  });

  test("builds folder navigation with the hub and folder trail", () => {
    expect(
      resourceHubFolderNavigation(
        {
          id: "folder-2",
          name: "Guides",
          pathToFolder: [{ id: "folder-1", name: "People Ops" }],
          resourceHub: { id: "hub-1", name: "Docs" },
        } as any,
        paths,
      ),
    ).toEqual([
      { to: "/resource-hubs/hub-1", label: "Docs" },
      { to: "/folders/folder-1", label: "People Ops" },
    ]);
  });

  test("renders project-backed resource breadcrumbs", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ResourcePageNavigation
          resource={
            {
              id: "document-1",
              name: "Spec",
              resourceHub: {
                id: "hub-1",
                name: "Docs",
                project: { id: "project-1", name: "Apollo" },
                space: { id: "space-1", name: "Operations" },
              },
              pathToDocument: [{ id: "folder-1", name: "Specs" }],
            } as any
          }
          paths={paths}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Apollo" })).toHaveAttribute("href", "/projects/project-1?tab=docs-and-files");
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/resource-hubs/hub-1");
    expect(screen.getByRole("link", { name: "Specs" })).toHaveAttribute("href", "/folders/folder-1");
  });

  test("renders goal-backed resource breadcrumbs", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ResourcePageNavigation
          resource={
            {
              id: "document-1",
              name: "Spec",
              resourceHub: {
                id: "hub-1",
                name: "Docs",
                goal: { id: "goal-1", name: "Company Goal" },
                space: { id: "space-1", name: "Operations" },
              },
              pathToDocument: [{ id: "folder-1", name: "Specs" }],
            } as any
          }
          paths={paths}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Company Goal" })).toHaveAttribute("href", "/goals/goal-1");
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/resource-hubs/hub-1");
    expect(screen.getByRole("link", { name: "Specs" })).toHaveAttribute("href", "/folders/folder-1");
  });

  test("omits the parent breadcrumb when the hub parent is missing", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NewResourcePageNavigation
          resourceHub={{ id: "hub-1", name: "Docs" } as any}
          folder={{ id: "folder-1", name: "Specs", pathToFolder: [{ id: "folder-2", name: "Nested" }] } as any}
          paths={paths}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: "Apollo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Operations" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/resource-hubs/hub-1");
    expect(screen.getByRole("link", { name: "Nested" })).toHaveAttribute("href", "/folders/folder-2");
  });
});
