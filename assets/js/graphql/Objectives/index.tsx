import React from 'react';
import { gql, useQuery, ApolloClient } from '@apollo/client';

const LIST_OBJECTIVES = gql`
  query ListObjectives($groupId: ID) {
    objectives(groupId: $groupId) {
      id
      name
      description

      owner {
        id
        fullName
        avatarUrl
        title
      }

      keyResults {
        id
        name
        status
        stepsCompleted
        stepsTotal
        updatedAt
      }
    }
  }
`;

const OBJECTIVE_SUBSCRIPTION = gql`
  subscription OnObjectiveAdded {
    objectiveAdded {
      id
    }
  }
`;

const CREATE_OBJECTIVE = gql`
  mutation CreateObjective($input: CreateObjectiveInput!) {
    createObjective(input: $input) {
      id
    }
  }
`;

const CREATE_KEY_RESULT = gql`
  mutation CreateKeyResult($input: CreateKeyResultInput!) {
    createKeyResult(input: $input) {
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

interface CreateObjectiveVariables {
  input: {
    name: string;
    description?: string;
    timeframe?: string;
    ownerId?: string;
  }
}

export function createObjective(client: ApolloClient<any>, variables: CreateObjectiveVariables) {
  return client.mutate({
    mutation: CREATE_OBJECTIVE,
    variables,
    refetchQueries: [
      {query: LIST_OBJECTIVES},
      'ListObjectives'
    ]
  });
}

interface CreateKeyResultVariables {
  input: {
    objectiveId: string;
    name: string;
  }
}

export function createKeyResult(client: ApolloClient<any>, variables: CreateKeyResultVariables) {
  return client.mutate({
    mutation: CREATE_KEY_RESULT,
    variables,
    refetchQueries: [
      {query: LIST_OBJECTIVES},
      'ListObjectives'
    ]
  });
}
