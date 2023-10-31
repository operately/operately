import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";

export default function createGraphQLWsLink(domain: string) {
  let wsLinkAbruptlyClosed = false;

  const wsClient = createClient({
    url: domain.replace("http", "ws") + "/api/graphql-ws",

    connectionParams: () => {
      return {
        token: window.appConfig.graphql.socketToken,
      };
    },

    //
    // We are telling the library to retry the connection
    // after any type of error has occurred.
    //
    // The library will ignore the return value of this function
    // in case of the following errors:
    //
    // All internal WebSocket fatal close codes (check isFatalInternalCloseCode in src/client.ts for exact list)
    //
    //   4500: Internal server error
    //   4005: Internal client error
    //   4400: Bad request
    //   4004: Bad response
    //   4401: Unauthorized tried subscribing before connect ack
    //   4406: Subprotocol not acceptable
    //   4409: Subscriber for <id> already exists distinction is very important
    //   4429: Too many initialisation requests
    //
    // The default implementation of the library retries the connection
    // using a randomised exponential backoff strategy. This means that
    // the library will attempt to reconnect after 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, ...
    // seconds since the last connection attempt, with a bit of randomness
    // to avoid reconnecting at the exact same time as other clients and
    // creating a thundering herd problem on the server.
    //
    shouldRetry: () => {
      return true;
    },

    //
    // The maximum number of connection attempts.
    // We have set it to 16, which means that the library will
    // stop trying to reconnect after 1 + 2 + 4 + 8 + 16 + 32 + 64 + 128 + 256 + 512 + 1024 + 2048 + 4096 + 8192 + 16384 + 32768 = 65535 seconds = 18 hours
    //
    // After the 18 hour limit is reached, the library will stop trying to reconnect
    // and the user will have to refresh the page to reconnect to the server.
    //
    retryAttempts: 16,

    on: {
      closed: (event) => {
        const { code } = event as CloseEvent;

        if (isAbruptlyClosed(code)) {
          console.error(`WebSocket connection abruptly closed. Code: ${code}. Retrying...`);
          wsLinkAbruptlyClosed = true;
        }
      },
      connected: () => {
        if (wsLinkAbruptlyClosed) {
          console.log("WebSocket connection re-established.");
        }
      },
    },
  });

  return new GraphQLWsLink(wsClient);
}

function isAbruptlyClosed(code: number) {
  return code !== 1000; // non-1000 close codes are abrupt closes
}
