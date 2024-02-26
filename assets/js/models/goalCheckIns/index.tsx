import client from "@/graphql/client";
import { gql, useMutation } from "@apollo/client";

import * as Time from "@/utils/time";
import { Update } from "@/gql";

type GoalCheckIn = Update;

export type { GoalCheckIn };

export function usePostUpdate(options: any) {
  return useMutation(
    gql`
      mutation CreateUpdate($input: CreateUpdateInput!) {
        createUpdate(input: $input) {
          id
        }
      }
    `,
    options,
  );
}

export function useEditUpdate(options: any) {
  return useMutation(
    gql`
      mutation EditUpdate($input: EditUpdateInput!) {
        editUpdate(input: $input) {
          id
        }
      }
    `,
    options,
  );
}

export function getCheckIn(id: string, options: any) {
  return client.query({
    query: gql`
      query GetCheckIn($id: ID!) {
        update(id: $id) {
          id
          title
          message
          messageType
          updatableId

          insertedAt
          updatedAt

          author {
            id
            name
            fullName
            title
          }

          comments {
            id
            content
            insertedAt
            updatedAt
            author {
              id
              name
              fullName
              title
            }
          }

          acknowledgingPerson {
            id
            name
            fullName
            title
          }

          acknowledged
          acknowledgedAt

          reactions {
            id
            type
            insertedAt
            updatedAt
            author {
              id
              name
              fullName
              title
            }
          }

          content {
            ... on GoalCheckIn {
              message
            }
          }
        }
      }
    `,
    variables: { id },
    ...options,
  });
}

export function getCheckIns(goalId: string, options?: any) {
  return client.query({
    query: gql`
      query GetCheckIn($id: ID!) {
        update(id: $id) {
          id
          title
          message
          messageType
          updatableId

          insertedAt
          updatedAt

          author {
            id
            name
            fullName
            title
          }

          comments {
            id
            content
            insertedAt
            updatedAt
            author {
              id
              name
              fullName
              title
            }
          }

          acknowledgingPerson {
            id
            name
            fullName
            title
          }

          acknowledged
          acknowledgedAt

          reactions {
            id
            type
            insertedAt
            updatedAt
            author {
              id
              name
              fullName
              title
            }
          }

          content {
            ... on GoalCheckIn {
              message
            }
          }
        }
      }
    `,
    variables: {
      filter: {
        goalId: goalId,
        type: "goal_check_in",
      },
    },
    fetchPolicy: "network-only",
  });
}

function sortByDate(updates: Update[]): Update[] {
  return [...updates].sort((a, b) => {
    const aDate = Time.parseISO(a.insertedAt);
    const bDate = Time.parseISO(b.insertedAt);

    if (aDate > bDate) return -1;
    if (aDate < bDate) return 1;
    return 0;
  });
}

interface UpdateGroupByMonth {
  key: string;
  year: number;
  month: string;
  updates: Update[];
}

export function groupUpdatesByMonth(updates: Update[]): UpdateGroupByMonth[] {
  const groups: UpdateGroupByMonth[] = [];
  const sorted = sortByDate(updates);

  sorted.forEach((update) => {
    const date = Time.parseISO(update.insertedAt);
    const year = date.getFullYear();
    const month = Time.getMonthName(date);
    const key = `${year}-${month}`;

    if (groups.length === 0) {
      groups.push({ key, year, month, updates: [update] });
    } else {
      const lastGroup = groups[groups.length - 1]!;

      if (lastGroup.key !== key) {
        groups.push({ key, year, month, updates: [update] });
      } else {
        lastGroup.updates.push(update);
      }
    }
  });

  return groups;
}

const ACKNOWLEDGE_UPDATE = gql`
  mutation Acknowledge($id: ID!) {
    acknowledge(id: $id) {
      id
    }
  }
`;

export function useAckUpdate(options = {}) {
  return useMutation(ACKNOWLEDGE_UPDATE, options);
}
