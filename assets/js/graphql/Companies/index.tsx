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
      }
    }
  }
`;

export function useCompany(id: string) {
  return useQuery(GET_COMPANY, {
    variables: { id },
  });
}
