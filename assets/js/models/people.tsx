import { Person } from "@/gql";

export function firstName(person: Person): string {
  return person.fullName.split(" ")[0]!;
}
