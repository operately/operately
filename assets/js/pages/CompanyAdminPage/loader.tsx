import { gql } from "@apollo/client";
import client from "@/graphql/client";
import { Company } from "@/gql/generated";

import * as Pages from "@/components/Pages";

interface LoaderResult {
  company: Company;
}

export async function loader(): Promise<LoaderResult> {
  let companyData = await client.query({
    query: QUERY,
    variables: {
      id: window.appConfig.companyID,
    },
    fetchPolicy: "network-only",
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

      admins {
        id
        fullName
        avatarUrl
      }
    }
  }
`;
