import { gql, useQuery } from "@apollo/client";
import client from "@/graphql/client";

interface GetCompanyOpts {
  include?: ("admins" | "people")[];
}

export function useCompany(opts?: GetCompanyOpts) {
  let { data, loading, error } = useQuery(QUERY, {
    variables: {
      id: window.appConfig.companyID,
      includeAdmins: opts?.include?.includes("admins") ?? false,
      includePeople: opts?.include?.includes("people") ?? false,
    },
    fetchPolicy: "network-only",
  });

  return {
    company: data?.company,
    loading,
    error,
  };
}

export async function getCompany(opts?: GetCompanyOpts) {
  let companyData = await client.query({
    query: QUERY,
    variables: {
      id: window.appConfig.companyID,
      includeAdmins: opts?.include?.includes("admins") ?? false,
      includePeople: opts?.include?.includes("people") ?? false,
    },
    fetchPolicy: "network-only",
  });

  return companyData.data.company;
}

const QUERY = gql`
  fragment People on Company {
    people {
      id
      title
      fullName
      avatarUrl
      email
    }
  }

  fragment Admins on Company {
    admins {
      id
      title
      fullName
      avatarUrl
      email
    }
  }

  query GetCompany($id: ID!, $includeAdmins: Boolean!, $includePeople: Boolean!) {
    company(id: $id) {
      id
      name
      mission
      trustedEmailDomains
      enabledExperimentalFeatures
      companySpaceId

      ...Admins @include(if: $includeAdmins)
      ...People @include(if: $includePeople)
    }
  }
`;
