import { ApolloClient, InMemoryCache, createHttpLink, split, gql, from } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";
import { onError } from "@apollo/client/link/error";

const domain = location.protocol + "//" + location.hostname + (location.port ? ":" + location.port : "");

const httpLink = createHttpLink({
  uri: domain + "/api/gql",
  credentials: "same-origin",
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: domain.replace("http", "ws") + "/api/graphql-ws",
    connectionParams: () => {
      return {
        token: (window as any).graphqlSocketToken,
      };
    },
  }),
);

import { createFragmentRegistry } from "@apollo/client/cache";
import personFragments from "@/gql/fragments/person";

const cache = new InMemoryCache({
  fragments: createFragmentRegistry(gql`
    ${personFragments}
  `),
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === "OperationDefinition" && definition.operation === "subscription";
  },
  wsLink,
  httpLink,
);

const errorLink = onError((params) => {
  let { graphQLErrors, networkError, operation } = params;

  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${JSON.stringify(
          path,
        )}, Extensions: ${JSON.stringify(extensions)}, Operation: ${operation.operationName}`,
      );
    });
  }
  // if (networkError) {
  //   console.log( `[Network error]: Error: ${networkError}, Operation: ${operation.operationName} );
  // }
});

const client = new ApolloClient({
  cache: cache,
  link: from([errorLink, splitLink]),
  connectToDevTools: false,
});

export default client;
