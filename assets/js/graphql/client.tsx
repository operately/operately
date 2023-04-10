import { ApolloClient, InMemoryCache, createHttpLink, split } from "@apollo/client";
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from "graphql-ws";

const domain = location.protocol + "//" + location.hostname + (location.port ? ":" + location.port : "");

const httpLink = createHttpLink({
  uri: domain + '/api/gql',
  credentials: 'same-origin'
});

const wsLink = new GraphQLWsLink(createClient({
  url: domain.replace("http", "ws") + '/api/graphql-ws'
}))

const cache = new InMemoryCache();

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

const client = new ApolloClient({
  cache: cache,
  link: splitLink,
  connectToDevTools: false
});

export default client;
