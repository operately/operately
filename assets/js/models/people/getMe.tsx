import { gql, useQuery } from "@apollo/client";
import client from "@/graphql/client";
import { Person } from "@/gql";

interface GetMeOptions {
  includeManager?: boolean;
}

export async function getMe(opts?: GetMeOptions): Promise<Person> {
  let meData = await client.query({
    query: GET_ME_QUERY,
    fetchPolicy: "network-only",
    variables: {
      includeManager: opts?.includeManager || false,
    },
  });

  return meData.data.me;
}

export function useMe(options?: GetMeOptions) {
  return useQuery(GET_ME_QUERY, {
    variables: {
      includeManager: options?.includeManager || false,
    },
    fetchPolicy: "network-only",
  });
}

export const GET_ME_QUERY = gql`
  fragment Manager on Person {
    manager {
      id
      fullName
      avatarUrl
      title
    }
  }

  query GetMe($includeManager: Boolean!) {
    me {
      id
      fullName
      avatarUrl
      title

      sendDailySummary
      notifyOnMention
      notifyAboutAssignments

      theme

      companyRole

      ...Manager @include(if: $includeManager)
    }
  }
`;
