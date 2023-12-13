import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetGoalOptions {
  includeTargets?: boolean;
}

export async function getGoal(id: string, options: GetGoalOptions = {}) {
  let data = await client.query({
    query: QUERY,
    variables: {
      id: id,
      includeTargets: options.includeTargets || false,
    },
    fetchPolicy: "network-only",
  });

  return data.data.goal;
}

const QUERY = gql`
  fragment PersonFields on Person {
    id
    fullName
    avatarUrl
    title
  }

  fragment Targets on Goal {
    targets {
      id
      name
      from
      to
      unit
    }
  }

  query GetGoal($id: ID!, $includeTargets: Boolean!) {
    goal(id: $id) {
      id
      name
      timeframe

      space {
        id
        name
        icon
        color
      }

      champion {
        ...PersonFields
      }

      reviewer {
        ...PersonFields
      }

      ...Targets @include(if: $includeTargets)
    }
  }
`;
