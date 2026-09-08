import Api, { type CompaniesListActivitiesResult } from "@/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteFeedActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    ...Api.companies.deleteActivityMutationOptions(),
    onSuccess: async (_data, { activityId }) => {
      const queryKey = Api.companies.listActivitiesQueryKeyPrefix();
      await queryClient.cancelQueries({ queryKey });

      queryClient.setQueriesData<CompaniesListActivitiesResult>({ queryKey }, (data) =>
        data
          ? {
              ...data,
              activities: data.activities.filter((activity) => activity.id !== activityId),
            }
          : data,
      );
      await queryClient.invalidateQueries({ queryKey });
    },
  });
}
