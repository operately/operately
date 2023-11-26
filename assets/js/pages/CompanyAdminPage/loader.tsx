import { gql } from "@apollo/client";
import client from "@/graphql/client";
import { Company } from "@/gql/generated";

import * as Pages from "@/components/Pages";

interface LoaderResult {
  company: Company;
}

export async function loader({ params }): Promise<LoaderResult> {
  let companyData = client.query({
    query: QUERY,
    variables: {
      id: params.id,
    },
  });

  return {
    company: companyData.data.company,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}

export const QUERY = gql`
  query GetCompany($id: ID!) {
    company(id: $id) {
      id
      name
      mission

      companyAdmins {
        id
        fullName
        avatarUrl
      }
    }
  }
`;
