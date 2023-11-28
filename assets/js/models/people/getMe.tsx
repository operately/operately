import { gql } from "@apollo/client";
import client from "@/graphql/client";
import { Person } from "@/gql";

export async function getMe(): Promise<Person> {
  let meData = await client.query({
    query: gql`
      query GetMe {
        me {
          id
          title
          fullName
          avatarUrl
        }
      }
    `,
    fetchPolicy: "network-only",
  });

  return meData.data.me;
}
