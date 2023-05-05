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
    }
  }
`;

export function useTenet(id: string) {
  return useQuery(GET_TENET, {
    variables: { id },
  });
}
