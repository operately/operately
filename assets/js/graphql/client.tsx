import { ApolloLink, ApolloClient, InMemoryCache, createHttpLink, split, from } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { onError } from "@apollo/client/link/error";
import { incrementNetworkRequests } from "@/features/PerfBar/usePerfBarData";
import createGraphQLWsLink from "./wsLink";

import { RetryLink } from "@apollo/client/link/retry";

function setupClient() {
  const domain = location.protocol + "//" + location.hostname + (location.port ? ":" + location.port : "");

  const httpLink = createHttpLink({
    uri: domain + "/api/gql",
    credentials: "same-origin",
  });

  const wsLink = createGraphQLWsLink(domain);
  const cache = new InMemoryCache();

  const requestCounterLink = new ApolloLink((operation, forward) => {
    incrementNetworkRequests();

    return forward(operation);
  });

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === "OperationDefinition" && definition.operation === "subscription";
    },
    wsLink,
    from([requestCounterLink, httpLink]),
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

    if (params.networkError) {
      console.log(`[Network error]: ${params.networkError}`);
    }
  });

  const retryLink = new RetryLink({
    delay: {
      initial: 300,
      max: 2000,
      jitter: true,
    },
    attempts: {
      max: 3,
      retryIf: (error, _operation) => {
        return error.message === "Failed to fetch";
      },
    },
  });

  const client = new ApolloClient({
    cache: cache,
    link: from([errorLink, retryLink, splitLink]),
    connectToDevTools: false,
  });

  return client;
}

let client: any;

if (typeof window !== "undefined") {
  client = setupClient();
} else {
  client = null;
}

export default client;

export function makeQueryFn<V, R>(query: any, field: string): (variables: V) => Promise<R> {
  return async (variables: V) => {
    const data = await client.query({
      query: query,
      variables: variables,
      fetchPolicy: "network-only",
    });

    return data.data[field];
  };
}
