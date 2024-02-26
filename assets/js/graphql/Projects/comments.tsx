import * as fragments from "@/graphql/Fragments";
import * as Reactions from "./reactions";

export const FRAGMENT = `
  {
    id
    content
    insertedAt
    author ${fragments.PERSON}
    reactions ${Reactions.FRAGMENT}
  }
`;
