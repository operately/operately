import { gql } from "@apollo/client";
import client from "@/graphql/client";
import { Company, Person } from "@/gql/generated";

import * as Pages from "@/components/Pages";
import * as People from "@/models/people";

interface LoaderResult {
  company: Company;
  me: Person;
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
    me: await People.getMe(),
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

      people {
        id
        title
        fullName
        avatarUrl
        email
      }
    }
  }
`;
