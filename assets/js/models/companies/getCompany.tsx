import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetCompanyOpts {
  include?: ("admins" | "people")[];
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

      ...Admins @include(if: $includeAdmins)
      ...People @include(if: $includePeople)
    }
  }
`;
