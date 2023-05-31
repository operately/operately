import React from "react";
import { gql, useQuery, ApolloClient, useApolloClient } from "@apollo/client";

import * as fragments from "@/graphql/Fragments";

interface Person {
  id: string;
  fullName: string;
  avatarUrl: string;
  title: string;
}

export interface KeyResult {
  id: string;
  name: string;
  status: string;
  stepsCompleted: number;
  stepsTotal: number;
  updatedAt: string;

  owner: Person;
}

const LIST_OBJECTIVES = gql`
  query ListObjectives($groupId: ID) {
    objectives(groupId: $groupId) {
      id
      name
      description

      group ${fragments.GROUP}
      owner ${fragments.PERSON}

      keyResults ${fragments.KEY_RESULT}
    }
  }
`;

const GET_OBJECTIVE = gql`
  query GetObjective($id: ID!) {
    objective(id: $id) {
      id
      name
      description

      owner ${fragments.PERSON}

      keyResults ${fragments.KEY_RESULT}
      activities ${fragments.ACTIVITY}

      projects {
        id
        name
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
      },
    });
  }, []);

  return query;
}

export function useObjective(id: string) {
  return useQuery(GET_OBJECTIVE, { variables: { id } });
}

export function listObjectives(
  client: ApolloClient<any>,
  variables: ListObjectivesVariables
) {
  return client.query({
    query: LIST_OBJECTIVES,
    variables,
    fetchPolicy: "network-only",
  });
}

interface CreateObjectiveVariables {
  input: {
    name: string;
    description?: string;
    timeframe?: string;
    ownerId?: string;
  };
}

export function createObjective(
  client: ApolloClient<any>,
  variables: CreateObjectiveVariables
) {
  return client.mutate({
    mutation: CREATE_OBJECTIVE,
    variables,
    refetchQueries: [{ query: LIST_OBJECTIVES }, "ListObjectives"],
  });
}

interface CreateKeyResultVariables {
  input: {
    objectiveId: string;
    name: string;
  };
}

export function createKeyResult(
  client: ApolloClient<any>,
  variables: CreateKeyResultVariables
) {
  return client.mutate({
    mutation: CREATE_KEY_RESULT,
    variables,
    refetchQueries: [{ query: LIST_OBJECTIVES }, "ListObjectives"],
  });
}

export function setObjectiveOwner(
  client: ApolloClient<any>,
  variables: { id: string; owner_id?: string | null }
) {
  return client.mutate({
    mutation: gql`
      mutation SetObjectiveOwner($id: ID!, $owner_id: ID) {
        setObjectiveOwner(id: $id, ownerId: $owner_id) {
          id
        }
      }
    `,
    variables,
    refetchQueries: [{ query: LIST_OBJECTIVES }, "ListObjectives"],
  });
}

export function setTargetOwner(
  client: ApolloClient<any>,
  variables: { id: string; owner_id?: string | null }
) {
  return client.mutate({
    mutation: gql`
      mutation SetKeyResultOwner($id: ID!, $owner_id: ID) {
        setKeyResultOwner(id: $id, ownerId: $owner_id) {
          id
        }
      }
    `,
    variables,
    refetchQueries: [{ query: LIST_OBJECTIVES }, "ListObjectives"],
  });
}

export function useSetGoalGroup(goalId: string) {
  const client = useApolloClient();

  return function (groupId: string) {
    return client.mutate({
      mutation: gql`
        mutation SetGoalGroup($id: ID!, $group_id: ID) {
          setGoalGroup(id: $id, group_id: $group_id) {
            id
          }
        }
      `,
      variables: { id: goalId, group_id: groupId },
      refetchQueries: [{ query: LIST_OBJECTIVES }, "ListObjectives"],
    });
  };
}

export function useSetTargetGroup(targetId: string) {
  const client = useApolloClient();

  return function (groupId: string) {
    return client.mutate({
      mutation: gql`
        mutation SetTargetGroup($id: ID!, $group_id: ID) {
          setTargetGroup(id: $id, group_id: $group_id) {
            id
          }
        }
      `,
      variables: { id: targetId, group_id: groupId },
      refetchQueries: [{ query: LIST_OBJECTIVES }, "ListObjectives"],
    });
  };
}
