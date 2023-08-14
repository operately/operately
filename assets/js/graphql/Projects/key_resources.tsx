import { gql } from "@apollo/client";

export interface KeyResource {
  id: string;
  title: string;
  link: string;
  type: "github" | "generic";
}

export const GQL_FRAGMENT = gql`
  {
    id
    title
    link
    type
  }
`;
