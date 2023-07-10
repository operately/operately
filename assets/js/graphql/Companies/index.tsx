import { useQuery, gql } from "@apollo/client";

const GET_COMPANY = gql`
  query GetCompany($id: ID!) {
    company(id: $id) {
      id
      name
      mission

      tenets {
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
      }
    }
  }
`;

export function useCompany() {
  const id = window.companyID;

  return useQuery(GET_COMPANY, {
    variables: { id },
  });
}
