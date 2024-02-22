import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetCheckInOptions {
  includeAuthor?: boolean;
  includeProject?: boolean;
}

export async function getCheckIn(id: string, options: GetCheckInOptions = {}) {
  let data = await client.query({
    query: QUERY,
    variables: {
      id: id,
      includeAuthor: !!options.includeAuthor,
      includeProject: !!options.includeProject,
    },
    fetchPolicy: "network-only",
  });

  return data.data.projectCheckIn;
}

const QUERY = gql`
  fragment ProjectOnProjectCheckIn on ProjectCheckIn {
    project {
      id
      name
    }
  }

  fragment AuthorOnProjectCheckIn on ProjectCheckIn {
    author {
      id
      fullName
      avatarUrl
      title
    }
  }

  query GetProjectCheckIn($id: ID!, $includeAuthor: Boolean!, $includeProject: Boolean!) {
    projectCheckIn(id: $id) {
      id
      status
      description
      insertedAt

      ...ProjectOnProjectCheckIn @include(if: $includeProject)
      ...AuthorOnProjectCheckIn @include(if: $includeAuthor)
    }
  }
`;
