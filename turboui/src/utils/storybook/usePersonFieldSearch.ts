import React from "react";
import { PersonField } from "../../PersonField";

export const usePersonFieldSearch = (potentialPeople: PersonField.Person[]) => {
  const [people, setPeople] = React.useState<PersonField.Person[]>(potentialPeople);

  const onSearch = React.useCallback(
    async (query: string) => {
      if (!query) {
        setPeople(potentialPeople);
      } else {
        setPeople(potentialPeople.filter((p) => p.fullName.toLowerCase().includes(query.toLowerCase())));
      }
    },
    [setPeople],
  );

  return { people, onSearch };
};
