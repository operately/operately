import { useQuery, gql } from "@apollo/client";

export const GET_COMPANY = gql`
  query GetCompany($id: ID!) {
    company(id: $id) {
      id
      name
      mission
    }
  }
`;

export interface Company {
  id: string;
  name: string;
  mission: string;
}

export function companyID() {
  return window.appConfig.companyID;
}

export function useCompany() {
  const id = companyID();

  return useQuery(GET_COMPANY, {
    variables: { id },
  });
}
