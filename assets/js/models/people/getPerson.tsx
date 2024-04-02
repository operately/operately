import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetPeopleOpts {
  id: string;
  includeManager?: boolean;
  includeReports?: boolean;
}

export async function getPerson(opts: GetPeopleOpts) {
  let res = await client.query({
    query: QUERY,
    variables: {
      id: opts.id,
      includeManager: !!opts.includeManager,
      includeReports: !!opts.includeReports,
    },
    fetchPolicy: "network-only",
  });

  return res.data.person;
}

const QUERY = gql`
  query GetPerson($id: ID!, $includeManager: Boolean!, $includeReports: Boolean!) {
    person(id: $id) {
      id
      fullName
      title
      avatarUrl
      email

      manager @include(if: $includeManager) {
        id
        fullName
        title
        avatarUrl
      }

      reports @include(if: $includeReports) {
        id
        fullName
        title
        avatarUrl
      }
    }
  }
`;
