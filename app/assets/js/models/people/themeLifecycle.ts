import Api, { GetThemeInput, GetThemeResult } from "@/api";
import { useMutation, useQuery, useQueryClient, type Query } from "@tanstack/react-query";

export function useGetTheme(input: GetThemeInput) {
  return useQuery(Api.getThemeQueryOptions(input));
}

export function useUpdateTheme() {
  const client = useQueryClient();

  return useMutation({
    ...Api.people.updateThemeMutationOptions(),
    onMutate: () => {
      const prefix = Api.getThemeQueryKeyPrefix();

      // Theme belongs to the account, including caches created under other company headers.
      const queries = client.getQueryCache().findAll({
        predicate: ({ queryKey }) =>
          queryKey[0] === prefix[0] && queryKey[1] === prefix[1] && queryKey[3] === prefix[3],
      });
      return { queries };
    },
    onSuccess: async (_result, { theme }, context: { queries: Query[] }) => {
      // Query identity prevents a late save from updating a new session after authentication clears the cache.
      const filters = { predicate: (query: Query) => context.queries.includes(query) };
      await client.cancelQueries(filters);
      client.setQueriesData<GetThemeResult>(filters, () => ({ theme }));
    },
  });
}
