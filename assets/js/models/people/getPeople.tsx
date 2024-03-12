import { gql } from "@apollo/client";
import client from "@/graphql/client";

export async function getPeople() {
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
      managerId
    }
  }
`;
