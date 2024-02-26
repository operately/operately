import * as fragments from "@/graphql/Fragments";

export const FRAGMENT = `
  {
    id
    emoji

    person ${fragments.PERSON}
  }
`;
