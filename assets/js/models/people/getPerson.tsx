import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetPeopleOpts {
  id: string;
}

export async function getPerson(opts: GetPeopleOpts) {
  let res = await client.query({
    query: QUERY,
    variables: {
      id: opts.id,
    },
    fetchPolicy: "network-only",
  });

  return res.data.person;
}

const QUERY = gql`
  query GetPerson($id: ID!) {
    person(id: $id) {
      id
      fullName
      title
      avatarUrl
    }
  }
`;
