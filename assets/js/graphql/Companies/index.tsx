import { useQuery, gql } from "@apollo/client";

export const GET_COMPANY = gql`
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

export function companyID() {
  return window.companyID;
}

export function useCompany() {
  const id = companyID();

  return useQuery(GET_COMPANY, {
    variables: { id },
  });
}
