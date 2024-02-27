import { gql, useApolloClient } from "@apollo/client";

export function useProjectContributorCandidatesQuery(id: string) {
  const client = useApolloClient();

  return async (query: string) => {
    const res = await client.query({
      query: QUERY,
      variables: {
        projectId: id,
        query: query,
      },
    });

    if (!res.data) return [];
    if (!res.data.projectContributorCandidates) return [];

    return res.data.projectContributorCandidates;
  };
}

const QUERY = gql`
  query projectContributorCandidates($projectId: ID!, $query: String!) {
    projectContributorCandidates(projectId: $projectId, query: $query) {
      id
      fullName
      title
      avatarUrl
    }
  }
`;
