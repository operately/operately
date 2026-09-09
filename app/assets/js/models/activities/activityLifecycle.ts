import Api, { type CompaniesListActivitiesResult } from "@/api";
import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";

type FeedCache = CompaniesListActivitiesResult | InfiniteData<CompaniesListActivitiesResult>;

function removeActivity(page: CompaniesListActivitiesResult, activityId: string): CompaniesListActivitiesResult {
  return { ...page, activities: page.activities.filter((activity) => activity.id !== activityId) };
}

export function useDeleteFeedActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    ...Api.companies.deleteActivityMutationOptions(),
    onSuccess: async (_data, { activityId }) => {
      const queryKey = Api.companies.listActivitiesQueryKeyPrefix();
      await queryClient.cancelQueries({ queryKey });

      queryClient.setQueriesData<FeedCache>({ queryKey }, (data) => {
        if (!data) return data;
        if ("pages" in data) {
          return { ...data, pages: data.pages.map((page) => removeActivity(page, activityId)) };
        }
        return removeActivity(data, activityId);
      });
      await queryClient.invalidateQueries({ queryKey });
    },
  });
}
