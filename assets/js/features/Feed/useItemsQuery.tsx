import { useQuery, gql } from "@apollo/client";

import FeedItems from "./FeedItems";

type ScopeType = "company" | "project" | "goal" | "space" | "person";

export function useItemsQuery(scopeType: ScopeType, scopeId: string) {
  const query = constructQuery();

  return useQuery(query, {
    fetchPolicy: "network-only",
    variables: {
      scopeType: scopeType,
      scopeId: scopeId,
    },
  });
}

function constructQuery() {
  const contentQueries = FeedItems.filter((item) => item.contentQuery.trim() !== "").map((item) => {
    return `
      ... on ${item.typename} {
        ${item.contentQuery}
      }
    `;
  });

  const queryString = `
    query ListActivities($scopeType: String!, $scopeId: String!) {
      activities(scopeType: $scopeType, scopeId: $scopeId) {
        id
        insertedAt

        author {
          id
          fullName
          avatarUrl
        }

        content {
          __typename

          ${contentQueries.map((query) => query).join("\n")}
        }
      }
    }
  `;

  return gql(queryString);
}
