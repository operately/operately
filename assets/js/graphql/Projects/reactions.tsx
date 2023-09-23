import * as fragments from "@/graphql/Fragments";

export const FRAGMENT = `
  {
    id
    reactionType
    person ${fragments.PERSON}
  }
`;
