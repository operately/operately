import { gql } from "@apollo/client";

export default gql`
  fragment PersonCoreFields on Person {
    id
    fullName
    title
    avatarUrl
  }
`;
