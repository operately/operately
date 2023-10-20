import * as Paper from "@/components/PaperContainer";

import client from "@/graphql/client";
import { gql } from "@apollo/client";
import { Notification } from "@/gql";

const query = gql`
  query ListNotifications($page: Int, $perPage: Int) {
    notifications(page: $page, perPage: $perPage) {
      id
      read
      activity {
        id
        insertedAt

        author {
          ...PersonCoreFields
        }

        content {
          __typename

          ... on ActivityContentProjectDiscussionSubmitted {
            title
            discussionId
            projectId

            project {
              name
            }
          }
        }
      }
    }
  }
`;

export interface LoaderResult {
  notifications: Notification[];
}

export async function loader(): Promise<LoaderResult> {
  const data = await client.query({
    query,
    fetchPolicy: "network-only",
    variables: {
      page: 1,
      perPage: 100,
    },
  });

  return {
    notifications: data.data.notifications as Notification[],
  };
}

export function useLoadedData(): LoaderResult {
  const [data, _] = Paper.useLoadedData() as [LoaderResult, () => void];

  return data;
}

export function useRefresh() {
  const [_, refresh] = Paper.useLoadedData() as [LoaderResult, () => void];

  return refresh;
}
