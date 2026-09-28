/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@/__tests__/renderHook";

jest.mock("axios");
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));

beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
});

jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/routes/paths", () => {
  const actual = jest.requireActual("@/routes/paths");
  const paths = new actual.Paths({ companyId: "company-1" });

  return { ...actual, usePaths: () => paths };
});

import { CompaniesQuickSearchResult } from "@/api";
import { Paths } from "@/routes/paths";

import { companySearchPathBuilder, useGlobalSearchHandler, mapQuickSearchResult } from "./useGlobalSearch";

const paths = new Paths({ companyId: "company-1" });

const apiResult = {
  spaces: [{ id: "space-1", name: "Space" }],
  projects: [
    {
      id: "project-1",
      name: "Project",
      champion: { fullName: "Project Champion" },
      space: { name: "Project Space" },
    },
  ],
  goals: [
    {
      id: "goal-1",
      name: "Goal",
      champion: { fullName: "Goal Champion" },
      space: { name: "Goal Space" },
    },
  ],
  milestones: [
    {
      id: "milestone-1",
      title: "Milestone",
      project: { name: "Project" },
      space: { name: "Project Space" },
    },
  ],
  tasks: [
    {
      id: "task-1",
      name: "Task",
      type: "project",
      project: { name: "Project" },
      projectSpace: { name: "Project Space" },
    },
  ],
  people: [
    {
      id: "person-1",
      fullName: "Person",
      title: "Engineer",
      avatarUrl: null,
    },
  ],
  discussions: [{ id: "discussion-1", title: "Discussion", context: "Discussion Space" }],
  folders: [{ id: "folder-1", name: "Folder", context: "Resource Hub" }],
  documents: [{ id: "document-1", name: "Document", context: "Resource Hub" }],
  files: [{ id: "file-1", name: "File", context: "Resource Hub" }],
  links: [{ id: "link-1", name: "Link", context: "Resource Hub" }],
} as CompaniesQuickSearchResult;

describe("global quick-search adapter", () => {
  test("maps all eleven result groups to canonical links", () => {
    expect(mapQuickSearchResult(paths, apiResult)).toEqual({
      spaces: [{ id: "space-1", name: "Space", link: "/company-1/spaces/space-1" }],
      projects: [
        {
          id: "project-1",
          name: "Project",
          link: "/company-1/projects/project-1",
          champion: { fullName: "Project Champion" },
          space: { name: "Project Space" },
        },
      ],
      goals: [
        {
          id: "goal-1",
          name: "Goal",
          link: "/company-1/goals/goal-1",
          champion: { fullName: "Goal Champion" },
          space: { name: "Goal Space" },
        },
      ],
      milestones: [
        {
          id: "milestone-1",
          title: "Milestone",
          link: "/company-1/milestones/milestone-1",
          project: { name: "Project" },
          space: { name: "Project Space" },
        },
      ],
      tasks: [
        {
          id: "task-1",
          name: "Task",
          link: "/company-1/tasks/task-1",
          project: { name: "Project" },
          space: { name: "Project Space" },
        },
      ],
      people: [
        {
          id: "person-1",
          fullName: "Person",
          title: "Engineer",
          avatarUrl: null,
          link: "/company-1/people/person-1",
        },
      ],
      discussions: [
        {
          id: "discussion-1",
          name: "Discussion",
          context: "Discussion Space",
          link: "/company-1/discussions/discussion-1",
        },
      ],
      folders: [
        {
          id: "folder-1",
          name: "Folder",
          context: "Resource Hub",
          link: "/company-1/folders/folder-1",
        },
      ],
      documents: [
        {
          id: "document-1",
          name: "Document",
          context: "Resource Hub",
          link: "/company-1/documents/document-1",
        },
      ],
      files: [
        {
          id: "file-1",
          name: "File",
          context: "Resource Hub",
          link: "/company-1/files/file-1",
        },
      ],
      links: [
        {
          id: "link-1",
          name: "Link",
          context: "Resource Hub",
          link: "/company-1/links/link-1",
        },
      ],
    });
  });

  test("propagates quick-search failures", async () => {
    const failure = new Error("search unavailable");
    const client = new QueryClient();
    jest.mocked(axios.get).mockRejectedValueOnce(failure);
    const hook = renderHook(() => useGlobalSearchHandler(), {
      initialProps: undefined,
      wrapper: ({ children }) => React.createElement(QueryClientProvider, { client }, children),
    });

    try {
      await expect(hook.result.current({ query: "roadmap" })).rejects.toBe(failure);
      jest.mocked(axios.get).mockResolvedValue({ data: apiResult });
      expect(await hook.result.current({ query: "roadmap" })).toEqual(mapQuickSearchResult(paths, apiResult));
      expect(client.getQueryData(Api.companies.quickSearchQueryKey({ query: "roadmap" }))).toEqual(apiResult);
    } finally {
      client.clear();
    }
  });

  test("builds full-text search paths for the current query", () => {
    expect(companySearchPathBuilder(paths)?.("customer plans")).toBe("/company-1/search?q=customer+plans");
  });
});
