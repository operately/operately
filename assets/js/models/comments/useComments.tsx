import { gql, useQuery } from "@apollo/client";

interface Options {
  entity: { id: string; type: string };
}

export function useComments(options: Options) {
  return useQuery(QUERY, {
    variables: {
      entityId: options.entity.id,
      entityType: options.entity.type,
    },
  });
}

const QUERY = gql`
  query Comments($entityId: ID!, $entityType: String!) {
    comments(entityId: $entityId, entityType: $entityType) {
      id
      content
      insertedAt

      author {
        id
        fullName
        avatarUrl
        title
      }

      reactions {
        id
        emoji

        person {
          id
          fullName
          avatarUrl
        }
      }
    }
  }
`;
