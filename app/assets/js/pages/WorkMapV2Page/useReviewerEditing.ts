import React from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { showErrorToast, type WorkMapV2PageProps } from "turboui";
import Api, { type PeopleSearchInput } from "@/api";
import { useUpdateGoalReviewer } from "@/models/goals";
import { useUpdateProjectReviewer } from "@/models/projects";
import { useQuerySearch } from "@/models/search/useQuerySearch";
import { invalidateWorkMapSettingsQueries } from "@/models/workMap";
import { idWithoutComments } from "@/routes/paths";

export function useReviewerEditing(editableItemIds: string[]): NonNullable<WorkMapV2PageProps["reviewerEditing"]> {
  const { t } = useTranslation();
  const client = useQueryClient();
  const goal = useUpdateGoalReviewer();
  const project = useUpdateProjectReviewer();
  const editable = React.useMemo(() => new Set(editableItemIds.map(idWithoutComments)), [editableItemIds]);
  const search = useQuerySearch((input: PeopleSearchInput) => Api.people.searchQueryOptions(input), {});

  return {
    canEdit: (id) => editable.has(idWithoutComments(id)),
    search: React.useCallback(
      async (item, query) => {
        try {
          const result = await search({
            query: query.trim(),
            searchScopeType: item.space ? "space" : "company",
            searchScopeId: item.space?.id,
            ignoredIds: [item.owner?.id, item.reviewer?.id].filter((id): id is string => Boolean(id)),
          });
          return result.people;
        } catch {
          showErrorToast(t("Couldn't load people"), t("Please try again."));
          return [];
        }
      },
      [search, t],
    ),
    save: async (item, person) => {
      const reviewerId = person?.id ?? null;
      try {
        if (item.type === "goal") await goal.mutateAsync({ goalId: item.id, reviewerId });
        else await project.mutateAsync({ projectId: item.id, reviewerId });
        await invalidateWorkMapSettingsQueries(client);
      } catch {
        showErrorToast(t("Couldn’t update the reviewer"), t("Please try again."));
      }
    },
  };
}
