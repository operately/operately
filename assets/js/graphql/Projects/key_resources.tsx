import { gql } from "@apollo/client";

export const GQL_FRAGMENT = gql`
  {
    id
    title
    link
    resourceType
  }
`;
