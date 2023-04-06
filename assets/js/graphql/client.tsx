import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

const link = createHttpLink({
  uri: 'http://localhost:4000/api/gql',
  credentials: 'same-origin'
});

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link
});

export default client;
