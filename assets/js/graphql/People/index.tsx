import { gql, ApolloClient } from '@apollo/client';

export function createProfile(client: ApolloClient<any>, fullName: string, title: string) {
  return client.mutate({
    mutation: gql`
      mutation CreateProfile($fullName: String!, $title: String!) {
        createProfile(fullName: $fullName, title: $title) {
          id
        }
      }
    `,
    variables: {
      fullName,
      title,
    }
  });
}
