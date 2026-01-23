import React from "react";

import { CompanyAdminManagePerson } from "../types";
import { PersonRow } from "./PersonRow";

type PersonHandler = (person: CompanyAdminManagePerson) => void;

export function PeopleList({
  people,
  onOpenRemove,
  onOpenReissue,
  onOpenView,
  onOpenRenew,
}: {
  people: CompanyAdminManagePerson[];
  onOpenRemove: PersonHandler;
  onOpenReissue: PersonHandler;
  onOpenView: PersonHandler;
  onOpenRenew: PersonHandler;
}) {
  return (
    <div>
      {people.map((person) => (
        <PersonRow
          key={person.id}
          person={person}
          onOpenRemove={onOpenRemove}
          onOpenReissue={onOpenReissue}
          onOpenView={onOpenView}
          onOpenRenew={onOpenRenew}
        />
      ))}
    </div>
  );
}
