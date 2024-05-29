import { gql, useQuery } from "@apollo/client";

export function useFeed(scopeId: string, scopeType: string) {
  const { data, loading, error } = useQuery(query, {
    fetchPolicy: "network-only",
    variables: {
      scopeType: scopeType,
      scopeId: scopeId,
    },
  });

  if (loading) return { activities: [], loading: true, error: null };

  if (error) {
    console.error(error);
    return { activities: [], loading: false, error };
  }

  return { activities: data.activities, loading: false, error: null };
}

const query = gql`
  query ListActivities($scopeType: String!, $scopeId: String!) {
    activities(scopeType: $scopeType, scopeId: $scopeId) {
      id
      insertedAt

      author {
        id
        fullName
        avatarUrl
        timezone
      }

      content {
        __typename
      }
    }
  }
`;
