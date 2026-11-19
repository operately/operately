import React from "react";
import Api from "@/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpdateTaskOrdering() {
  const client = useQueryClient();
  const saving = React.useRef(false);
  const queryKey = Api.people.getTaskOrderingQueryKey({});

  const mutation = useMutation({
    ...Api.people.updateTaskOrderingMutationOptions(),
    onMutate: async ({ taskIds }) => {
      await client.cancelQueries({ queryKey });
      const previous = client.getQueryData(queryKey);
      client.setQueryData(queryKey, { taskIds });
      return { previous };
    },
    onSuccess: (data) => {
      client.setQueryData(queryKey, data);
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) client.setQueryData(queryKey, context.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey }),
  });

  const save = async (taskIds: string[]): Promise<void> => {
    // Block a second action immediately, including before React renders the disabled controls.
    if (saving.current) return;
    saving.current = true;
    try {
      await mutation.mutateAsync({ taskIds });
    } finally {
      saving.current = false;
    }
  };

  return { save, isPending: mutation.isPending };
}
