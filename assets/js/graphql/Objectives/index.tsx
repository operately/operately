import React from 'react';
import { gql, useQuery, ApolloClient } from '@apollo/client';

const LIST_OBJECTIVES = gql`
  query ListObjectives($groupId: ID!) {
    objectives(groupId: $groupId, objectiveId: $objectiveId) {
      id
      name
      description

      owner {
        id
        fullName
        avatarUrl
        title
      }
    }
  }
`;

const OBJECTIVE_SUBSCRIPTION = gql`
  subscription OnObjectiveAdded() {
    objectiveAdded {
      id
    }
  }
`;

interface ListObjectivesVariables {
  groupId?: string;
}

export function useObjectives(variables: ListObjectivesVariables) {
  const query = useQuery(LIST_OBJECTIVES, { variables });

  React.useEffect(() => {
    query.subscribeToMore({
      document: OBJECTIVE_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        query.refetch();
        return prev;
      }
    })
  }, [])

  return query;
}

export function listObjectives(client: ApolloClient<any>, variables: ListObjectivesVariables) {
  return client.query({
    query: LIST_OBJECTIVES,
    variables,
    fetchPolicy: 'network-only'
  });
}
