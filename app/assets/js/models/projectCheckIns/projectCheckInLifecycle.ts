import Api from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

export async function invalidateProjectCheckInQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: Api.projects.getCheckInQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.projects.listCheckInsQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.projects.getQueryKeyPrefix() }),
  ]);
}

export function usePostProjectCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.createCheckInMutationOptions(),
    onSuccess: () => {
      void invalidateProjectCheckInQueries(queryClient);
    },
  });
}

export function useEditProjectCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.updateCheckInMutationOptions(),
    onSuccess: () => {
      void invalidateProjectCheckInQueries(queryClient);
    },
  });
}

export function useDeleteProjectCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.deleteCheckInMutationOptions(),
    onSuccess: () => {
      void invalidateProjectCheckInQueries(queryClient);
    },
  });
}

export function useAcknowledgeProjectCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.acknowledgeCheckInMutationOptions(),
    onSuccess: () => {
      void invalidateProjectCheckInQueries(queryClient);
    },
  });
}
