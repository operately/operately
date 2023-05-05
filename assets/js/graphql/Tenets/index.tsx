import { useQuery, gql } from "@apollo/client";

const GET_TENET = gql`
  query GetTenet($id: ID!) {
    tenet(id: $id) {
      id
      name
      description

      kpis {
        id
        name
        description
        unit
        target
        targetDirection

        metrics {
          value
          date
        }
      }

      company {
        name
      }

      objectives {
        id
        name
        description

        owner {
          id
          fullName
          title
          avatarUrl
        }
      }
    }
  }
`;

export function useTenet(id: string) {
  return useQuery(GET_TENET, {
    variables: { id },
  });
}
