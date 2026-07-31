import Api, { CompaniesQuickSearchInput, CompaniesQuickSearchResult, Company, QuickSearchResource } from "@/api";
import * as React from "react";

import * as Companies from "@/models/companies";
import { Paths, usePaths } from "@/routes/paths";
import { GlobalSearch } from "turboui";

type SearchParams = { query: string };
type QuickSearchApi = (input: CompaniesQuickSearchInput) => Promise<CompaniesQuickSearchResult>;

export function useGlobalSearchHandler(): (params: SearchParams) => Promise<GlobalSearch.SearchResult> {
  const paths = usePaths();

  return React.useCallback(({ query }: SearchParams) => loadQuickSearchResults(paths, query), [paths]);
}

export function companySearchPathBuilder(paths: Paths, company: Company): GlobalSearch.Props["fullTextSearchPath"] {
  if (!Companies.hasFeature(company, "full_text_search")) {
    return undefined;
  }

  return (query) => paths.searchPath(query);
}

export async function loadQuickSearchResults(
  paths: Paths,
  query: string,
  search: QuickSearchApi = Api.companies.quickSearch,
): Promise<GlobalSearch.SearchResult> {
  const result = await search({ query });
  return mapQuickSearchResult(paths, result);
}

export function mapQuickSearchResult(paths: Paths, result: CompaniesQuickSearchResult): GlobalSearch.SearchResult {
  return {
    spaces: prepareSpaces(paths, result),
    projects: prepareProjects(paths, result),
    goals: prepareGoals(paths, result),
    milestones: prepareMilestones(paths, result),
    tasks: prepareTasks(paths, result),
    people: preparePeople(paths, result),
    discussions: result.discussions.map((discussion) => ({
      id: discussion.id,
      name: discussion.title,
      context: discussion.context,
      link: paths.discussionPath(discussion.id),
    })),
    folders: prepareResources(result.folders, paths.resourceHubFolderPath.bind(paths)),
    documents: prepareResources(result.documents, paths.resourceHubDocumentPath.bind(paths)),
    files: prepareResources(result.files, paths.resourceHubFilePath.bind(paths)),
    links: prepareResources(result.links, paths.resourceHubLinkPath.bind(paths)),
  };
}

function prepareSpaces(paths: Paths, result: CompaniesQuickSearchResult): GlobalSearch.Space[] {
  return (
    result.spaces?.map((space) => ({
      id: space.id,
      name: space.name,
      link: paths.spacePath(space.id),
    })) || []
  );
}

function prepareProjects(paths: Paths, result: CompaniesQuickSearchResult): GlobalSearch.Project[] {
  return (
    result.projects?.map((project) => ({
      id: project.id!,
      name: project.name!,
      link: paths.projectPath(project.id!),
      champion: project.champion ?? null,
      space: project.space ?? null,
    })) || []
  );
}

function prepareGoals(paths: Paths, result: CompaniesQuickSearchResult): GlobalSearch.Goal[] {
  return (
    result.goals?.map((goal) => ({
      id: goal.id!,
      name: goal.name!,
      link: paths.goalPath(goal.id!),
      champion: goal.champion ?? null,
      space: goal.space ?? null,
    })) || []
  );
}

function prepareMilestones(paths: Paths, result: CompaniesQuickSearchResult): GlobalSearch.Milestone[] {
  return (
    result.milestones?.map((milestone) => ({
      id: milestone.id!,
      title: milestone.title!,
      link: paths.projectMilestonePath(milestone.id!),
      project: milestone.project ?? null,
      space: milestone.space ?? null,
    })) || []
  );
}

function preparePeople(paths: Paths, result: CompaniesQuickSearchResult): GlobalSearch.Person[] {
  return (
    result.people?.map((person) => ({
      id: person.id!,
      fullName: person.fullName!,
      title: person.title || null,
      link: paths.profilePath(person.id!),
      avatarUrl: person.avatarUrl || null,
    })) || []
  );
}

function prepareTasks(paths: Paths, result: CompaniesQuickSearchResult): GlobalSearch.Task[] {
  return (
    result.tasks?.map((task) => ({
      id: task.id,
      name: task.name,
      link:
        task.type === "project"
          ? paths.taskPath(task.id!)
          : paths.spaceKanbanPath(task.space?.id || "", { taskId: task.id }),
      project: task.project ?? null,
      space: task.type === "project" ? task.projectSpace : task.space,
    })) || []
  );
}

function prepareResources(
  resources: QuickSearchResource[],
  resourcePath: (id: string) => string,
): GlobalSearch.Resource[] {
  return resources.map((resource) => ({
    id: resource.id,
    name: resource.name,
    context: resource.context,
    link: resourcePath(resource.id),
  }));
}
