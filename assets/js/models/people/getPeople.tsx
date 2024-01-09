import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetPeopleOpts {
  includeManager?: boolean;
}

export async function getPeople(opts?: GetPeopleOpts) {
  let res = await client.query({
    query: QUERY,
    variables: {},
    fetchPolicy: "network-only",
  });

  return res.data.people;
}

const QUERY = gql`
  query GetPeople {
    people {
      id
      fullName
      title
      avatarUrl
    }
  }
`;
