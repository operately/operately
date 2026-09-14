import { type QueryClient, type UseMutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateGoalLifecycleQueries } from "./goalLifecycle";

export function assertGoalMutationSucceeded(result: unknown) {
  if (result === false || (result && typeof result === "object" && "success" in result && result.success === false)) {
    throw new Error("Goal update failed");
  }
}

export function useGoalMutation<Result, Input extends { goalId: string }, Context = unknown>(
  options: UseMutationOptions<Result, Error, Input, Context>,
  invalidate: (client: QueryClient, input: Input, result: Result, context: Context | undefined) => Promise<void> = (
    client,
    input,
  ) => invalidateGoalLifecycleQueries(client, input.goalId),
) {
  const client = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async (input, context) => {
      if (!options.mutationFn) throw new Error("Goal mutation function is missing");
      const result = await options.mutationFn(input, context);
      assertGoalMutationSucceeded(result);
      return result;
    },
    onSuccess: async (result, input, context) => {
      // A refresh failure must not roll back a write that the server accepted.
      await invalidate(client, input, result, context).catch((error) =>
        console.error("Failed to refresh goal queries", error),
      );
    },
  });
}
