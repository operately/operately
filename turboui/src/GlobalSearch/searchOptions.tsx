import * as React from "react";

import { Avatar } from "../Avatar";
import {
  IconFile,
  IconFileText,
  IconFolderFilled,
  IconGoal,
  IconLink,
  IconMessage,
  IconMilestone,
  IconProject,
  IconSearch,
  IconTask,
  IconTent,
} from "../icons";
import { createTestId } from "../TestableElement";
import type { GlobalSearch } from "./index";

export interface SearchOption {
  id: string;
  optionId: string;
  resourceType: string;
  name: string;
  link: string;
  icon: React.ReactNode;
  subtitle?: string;
  testId: string;
}

export interface SearchGroup {
  title: string;
  options: SearchOption[];
}

export function buildSearchGroups(results: GlobalSearch.SearchResult, testId: string): SearchGroup[] {
  const groups: SearchGroup[] = [
    {
      title: "SPACES",
      options: (results.spaces ?? []).map((space) =>
        buildOption(testId, "space", space.id, space.name, space.link, <IconTent size={24} />),
      ),
    },
    {
      title: "GOALS",
      options: (results.goals ?? []).map((goal) =>
        buildOption(
          testId,
          "goal",
          goal.id,
          goal.name,
          goal.link,
          <IconGoal size={24} />,
          compactContext(goal.champion?.fullName, goal.space?.name),
        ),
      ),
    },
    {
      title: "PROJECTS",
      options: (results.projects ?? []).map((project) =>
        buildOption(
          testId,
          "project",
          project.id,
          project.name,
          project.link,
          <IconProject size={24} />,
          compactContext(project.champion?.fullName, project.space?.name),
        ),
      ),
    },
    {
      title: "MILESTONES",
      options: (results.milestones ?? []).map((milestone) =>
        buildOption(
          testId,
          "milestone",
          milestone.id,
          milestone.title,
          milestone.link,
          <IconMilestone size={24} />,
          compactContext(milestone.project?.name, milestone.space?.name),
        ),
      ),
    },
    {
      title: "TASKS",
      options: (results.tasks ?? []).map((task) =>
        buildOption(
          testId,
          "task",
          task.id,
          task.name,
          task.link,
          <IconTask size={24} />,
          compactContext(task.project?.name, task.space?.name),
        ),
      ),
    },
    {
      title: "PEOPLE",
      options: (results.people ?? []).map((person) =>
        buildOption(
          testId,
          "person",
          person.id,
          person.fullName,
          person.link,
          <Avatar person={person} size={24} />,
          person.title || undefined,
        ),
      ),
    },
    resourceGroup(testId, "DISCUSSIONS", "discussion", results.discussions, <IconMessage size={24} />),
    resourceGroup(testId, "FOLDERS", "folder", results.folders, <IconFolderFilled size={24} />),
    resourceGroup(testId, "DOCUMENTS", "document", results.documents, <IconFileText size={24} />),
    resourceGroup(testId, "FILES", "file", results.files, <IconFile size={24} />),
    resourceGroup(testId, "LINKS", "link", results.links, <IconLink size={24} />),
  ];

  return groups.filter((group) => group.options.length > 0);
}

export function buildFullTextSearchOption(state: GlobalSearch.State): SearchOption | undefined {
  const query = state.query.trim();

  if (!state.fullTextSearchPath || query.length < 2) {
    return undefined;
  }

  return {
    id: "full-text-search",
    optionId: createTestId(state.testId, "option", "full-text-search"),
    resourceType: "full-text-search",
    name: `Search all content for “${query}”`,
    link: state.fullTextSearchPath(query),
    icon: <IconSearch size={24} />,
    testId: createTestId(state.testId, "full-text-search"),
  };
}

function resourceGroup(
  testId: string,
  title: string,
  type: string,
  resources: GlobalSearch.Resource[] | null | undefined,
  icon: React.ReactNode,
): SearchGroup {
  return {
    title,
    options: (resources ?? []).map((resource) =>
      buildOption(testId, type, resource.id, resource.name, resource.link, icon, resource.context),
    ),
  };
}

function buildOption(
  testId: string,
  type: string,
  id: string,
  name: string,
  link: string,
  icon: React.ReactNode,
  subtitle?: string,
): SearchOption {
  return {
    id,
    optionId: createTestId(testId, "option", type, id),
    resourceType: type,
    name,
    link,
    icon,
    subtitle,
    testId: createTestId(testId, type, name),
  };
}

function compactContext(...parts: Array<string | null | undefined>): string | undefined {
  const context = parts.filter(Boolean).join(" • ");
  return context || undefined;
}
