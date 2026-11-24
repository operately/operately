import React from "react";

import Api, { CompaniesQuickSearchResult } from "@/api";
import { queryClient } from "@/api/queryClient";
import { assertPresent } from "@/utils/assertions";

import * as People from "@/models/people";
import * as Blobs from "@/models/blobs";

import { Paths, useOptionalPaths } from "@/routes/paths";
import { useMe, useMentionedPersonLookupFn } from "@/contexts/CurrentCompanyContext";
import type { RichEditorHandlers, ResourceSuggestion } from "turboui";

interface Props {
  scope?: People.SearchScope;
}

export function useRichEditorHandlers(attrs?: Props): RichEditorHandlers {
  const paths = useOptionalPaths();
  const me = useMe();
  const viewerId = me?.id;
  const companyPath = paths?.homePath();
  const mentionedPersonLookup = useMentionedPersonLookupFn();

  const peopleSearch = People.useMentionedPersonSearch({
    scope: attrs?.scope ?? People.NoneSearchScope,
    transformResult: (p) => {
      if (paths) {
        return People.parsePersonForTurboUi(paths, p)!;
      }

      // It never executes if paths is not present
      return {
        id: p.id,
        fullName: p.fullName,
        email: p.email,
        title: p.title || "",
        avatarUrl: p.avatarUrl || "",
        profileLink: "",
      };
    },
  });

  const resolveResourceLinks = React.useCallback<NonNullable<RichEditorHandlers["resolveResourceLinks"]>>(
    async (urls) => {
      if (!viewerId || !companyPath) return [];
      const options = Api.rich_content.resolveLinksQueryOptions({ urls });
      const queryFn = options.queryFn;

      assertPresent(queryFn, "Missing resource link query function");

      const result = await queryClient.query({
        queryKey: ["rich-content-links", options.queryKey, companyPath, viewerId],
        queryFn: (context) => queryFn({ ...context, queryKey: options.queryKey }),
        staleTime: 0,
      });
      return result.links;
    },
    [companyPath, viewerId],
  );

  const resourceSearch = React.useCallback<NonNullable<RichEditorHandlers["resourceSearch"]>>(
    async (query) => {
      if (!paths || !viewerId || !companyPath) return [];
      const options = Api.companies.quickSearchQueryOptions({ query, includeCompleted: true });
      const queryFn = options.queryFn;
      assertPresent(queryFn, "Missing quick search query function");
      const result = await queryClient.fetchQuery({
        queryKey: ["rich-editor-resources", options.queryKey, companyPath, viewerId],
        queryFn: (context) => queryFn({ ...context, queryKey: options.queryKey }),
        staleTime: 30_000,
        retry: false,
      });
      return mapResourceSuggestions(paths, result);
    },
    [paths, companyPath, viewerId],
  );

  const uploadFile = React.useCallback((file: File, onProgress: (progress: number) => void) => {
    return Blobs.uploadFile(file, onProgress);
  }, []);

  return {
    mentionedPersonLookup,
    resolveResourceLinks: paths ? resolveResourceLinks : null,
    ...(paths ? { peopleSearch, resourceSearch, uploadFile } : {}),
  };
}

function mapResourceSuggestions(paths: Paths, result: CompaniesQuickSearchResult): ResourceSuggestion[] {
  const goals = result.goals.map((goal) => ({
    id: goal.id,
    title: goal.name,
    type: "goal" as const,
    context: goal.space?.name,
    url: paths.goalPath(goal.id),
  }));
  const projects = result.projects.map((project) => ({
    id: project.id,
    title: project.name,
    type: "project" as const,
    context: project.space?.name,
    url: paths.projectPath(project.id),
  }));
  const tasks = result.tasks.flatMap((task): ResourceSuggestion[] => {
    if (task.type === "project") {
      if (!task.project) return [];
      return [
        { id: task.id, title: task.name, type: "task", context: task.project.name, url: paths.taskPath(task.id) },
      ];
    }
    if (!task.space || !task.boardId) return [];
    return [
      {
        id: task.id,
        title: task.name,
        type: "task",
        context: task.space.name,
        url: paths.spaceKanbanPath(task.space.id, task.boardId, { taskId: task.id }),
      },
    ];
  });
  return [...goals, ...projects, ...tasks];
}
