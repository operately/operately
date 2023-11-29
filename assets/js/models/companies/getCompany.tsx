import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetCompanyOpts {
  include?: ("admins" | "people")[];
}

export async function getCompany(opts?: GetCompanyOpts) {
  let query = buildQuery(opts);

  let companyData = await client.query({
    query: query,
    variables: {
      id: window.appConfig.companyID,
    },
    fetchPolicy: "network-only",
  });

  return companyData.data.company;
}

function buildQuery(opts?: GetCompanyOpts) {
  let query = COMPANY_CORE_FIELDS;

  if (opts?.include?.includes("admins")) {
    query = COMPANY_WITH_ADMINS;
  }

  if (opts?.include?.includes("people")) {
    query = COMPANY_WITH_PEOPLE;
  }

  return query;
}

const COMPANY_CORE_FIELDS = gql`
  query GetCompany($id: ID!) {
    company(id: $id) {
      id
      name
      mission

      admins {
        id
        title
        fullName
        avatarUrl
      }
    }
  }
`;

const COMPANY_WITH_ADMINS = gql`
  query GetCompany($id: ID!) {
    company(id: $id) {
      id
      name
      mission

      admins {
        id
        title
        fullName
        avatarUrl
      }
    }
  }
`;

const COMPANY_WITH_PEOPLE = gql`
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
