import { ApolloClient, InMemoryCache, createHttpLink, split, from } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { onError } from "@apollo/client/link/error";

import createGraphQLWsLink from "./wsLink";

const domain = location.protocol + "//" + location.hostname + (location.port ? ":" + location.port : "");

const httpLink = createHttpLink({
  uri: domain + "/api/gql",
  credentials: "same-origin",
});

const wsLink = createGraphQLWsLink(domain);
const cache = new InMemoryCache();

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === "OperationDefinition" && definition.operation === "subscription";
  },
  wsLink,
  httpLink,
);

const errorLink = onError((params) => {
  let { graphQLErrors, operation } = params;

  if (graphQLErrors) {
    Array.from(graphQLErrors).forEach(({ message, locations, path, extensions }) => {
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${JSON.stringify(
          path,
        )}, Extensions: ${JSON.stringify(extensions)}, Operation: ${operation.operationName}`,
      );
    });
  }
});

const client = new ApolloClient({
  cache: cache,
  link: from([errorLink, splitLink]),
  connectToDevTools: false,
});

export default client;
