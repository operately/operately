import client from "@/graphql/client";
import { GetInvitationDocument } from "@/gql/generated";


export async function getInvitation(token: string) {
  const res = await client.query({
    query: GetInvitationDocument,
    variables: {
      token,
    },
    fetchPolicy: "network-only",
  });

  return res.data.invitation;
}