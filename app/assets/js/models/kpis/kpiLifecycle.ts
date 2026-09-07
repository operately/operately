import Api from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

export async function invalidateKpiQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: Api.kpis.getKpiQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.kpis.listKpisQueryKeyPrefix() }),
  ]);
}

export function useCreateKpi() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.kpis.createKpiMutationOptions(),
    onSuccess: () => {
      void invalidateKpiQueries(queryClient);
    },
  });
}

export function useEditKpi() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.kpis.editKpiMutationOptions(),
    onSuccess: () => {
      void invalidateKpiQueries(queryClient);
    },
  });
}

export function useDeleteKpi() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.kpis.deleteKpiMutationOptions(),
    onSuccess: () => {
      void invalidateKpiQueries(queryClient);
    },
  });
}

export function useLogKpiEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.kpis.logKpiEntryMutationOptions(),
    onSuccess: () => {
      void invalidateKpiQueries(queryClient);
    },
  });
}

export function useEditKpiEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.kpis.editKpiEntryMutationOptions(),
    onSuccess: () => {
      void invalidateKpiQueries(queryClient);
    },
  });
}

export function useDeleteKpiEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.kpis.deleteKpiEntryMutationOptions(),
    onSuccess: () => {
      void invalidateKpiQueries(queryClient);
    },
  });
}

export function useAddKpiAnnotation() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.kpis.addKpiAnnotationMutationOptions(),
    onSuccess: () => {
      void invalidateKpiQueries(queryClient);
    },
  });
}

export function useEditKpiAnnotation() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.kpis.editKpiAnnotationMutationOptions(),
    onSuccess: () => {
      void invalidateKpiQueries(queryClient);
    },
  });
}

export function useDeleteKpiAnnotation() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.kpis.deleteKpiAnnotationMutationOptions(),
    onSuccess: () => {
      void invalidateKpiQueries(queryClient);
    },
  });
}
