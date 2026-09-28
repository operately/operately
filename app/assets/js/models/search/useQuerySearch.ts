import { useMemo } from "react";
import { hashKey, useQueryClient, type FetchQueryOptions } from "@tanstack/react-query";

// Reuse results for identical searches for 30 seconds, unless invalidated earlier.
// Concurrent requests for the same input share a single request.
export function useQuerySearch<Input, Result>(
  optionsForInput: (input: Input) => FetchQueryOptions<Result>,
  initialInput: Input,
): (input: Input) => Promise<Result> {
  const client = useQueryClient();
  // The initial query's key captures the endpoint and static context, keeping
  // the callback stable when callers recreate their options or exclusion arrays.
  const context = hashKey(optionsForInput(initialInput).queryKey);

  return useMemo(
    () => (input: Input) =>
      client.fetchQuery({
        ...optionsForInput(input),
        staleTime: 30_000,
        retry: false,
      }),
    [client, context],
  );
}
