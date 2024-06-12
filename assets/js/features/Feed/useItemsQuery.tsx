import { useQuery, gql } from "@apollo/client";
import { camelCaseToSnakeCase } from "@/utils/strings";

import FeedItems from "./FeedItems";
import Api from "@/api";

type ScopeType = "company" | "project" | "goal" | "space" | "person";

export function useItemsQuery(scopeType: ScopeType, scopeId: string) {
  if (scopeType === "company") {
    return useApiQuery(scopeType, scopeId);
  } else {
    return useGqlQuery(scopeType, scopeId);
  }
}

function useApiQuery(scopeType: ScopeType, scopeId: string) {
  return Api.useGetActivities({ scopeType: scopeType, scopeId: scopeId });
}

function useGqlQuery(scopeType: ScopeType, scopeId: string) {
  const query = constructQuery();

  const actions = FeedItems.map((item) => item.typename.replace("ActivityContent", "")).map(camelCaseToSnakeCase);

  return useQuery(query, {
    fetchPolicy: "network-only",
    variables: {
      scopeType: scopeType,
      scopeId: scopeId,
      actions: actions,
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
    query ListActivities($scopeType: String!, $scopeId: String!, $actions: [String!]) {
      activities(scopeType: $scopeType, scopeId: $scopeId, actions: $actions) {
        id
        insertedAt

        author {
          id
          fullName
          avatarUrl
          timezone
        }

        commentThread {
          id
          message
          title
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
