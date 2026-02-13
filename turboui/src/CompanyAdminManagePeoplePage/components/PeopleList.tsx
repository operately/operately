import React from "react";

import { AccessOptions, CompanyAdminManagePerson, Permissions } from "../types";
import { PersonRow } from "./PersonRow";

type PersonHandler = (person: CompanyAdminManagePerson) => void;

interface Props {
  people: CompanyAdminManagePerson[];
  testId?: string;
  onOpenRemove: PersonHandler;
  onOpenConvert: PersonHandler;
  onOpenReissue: PersonHandler;
  onOpenView: PersonHandler;
  onOpenRenew: PersonHandler;
  onChangeAccessLevel: (personId: string, accessLevel: AccessOptions) => void;
  permissions?: Permissions;
  showConvertToGuest?: boolean;
  showAccessLevelOptions?: boolean;
}

export function PeopleList({
  people,
  testId,
  onOpenRemove,
  onOpenConvert,
  onOpenReissue,
  onOpenView,
  onOpenRenew,
  onChangeAccessLevel,
  permissions,
  showConvertToGuest,
  showAccessLevelOptions,
}: Props) {
  return (
    <div data-test-id={testId}>
      {people.map((person) => (
        <PersonRow
          key={person.id}
          person={person}
          onOpenRemove={onOpenRemove}
          onOpenConvert={onOpenConvert}
          onOpenReissue={onOpenReissue}
          onOpenView={onOpenView}
          onOpenRenew={onOpenRenew}
          onChangeAccessLevel={onChangeAccessLevel}
          permissions={permissions}
          showConvertToGuest={showConvertToGuest}
          showAccessLevelOptions={showAccessLevelOptions}
        />
      ))}
    </div>
  );
}
