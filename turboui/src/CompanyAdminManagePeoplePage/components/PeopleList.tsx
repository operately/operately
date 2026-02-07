import React from "react";

import { CompanyAdminManagePerson, Permissions } from "../types";
import { PersonRow } from "./PersonRow";

type PersonHandler = (person: CompanyAdminManagePerson) => void;

interface Props {
  people: CompanyAdminManagePerson[];
  onOpenRemove: PersonHandler;
  onOpenReissue: PersonHandler;
  onOpenView: PersonHandler;
  onOpenRenew: PersonHandler;
  onChangeAccessLevel: (personId: string, accessLevel: number) => void;
  permissions?: Permissions;
}

export function PeopleList({
  people,
  onOpenRemove,
  onOpenReissue,
  onOpenView,
  onOpenRenew,
  onChangeAccessLevel,
  permissions,
}: Props) {
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
          onChangeAccessLevel={onChangeAccessLevel}
          permissions={permissions}
        />
      ))}
    </div>
  );
}
