import React from "react";

import { Avatar } from "../../Avatar";
import { BlackLink } from "../../Link";
import { AccessLevelBadge } from "../../AccessLevelBadge";
import { IconAlertTriangle } from "../../icons";
import { AccessOptions, CompanyAdminManagePerson, Permissions } from "../types";
import { PersonOptions } from "./PersonOptions";
import { createTestId } from "../../TestableElement";

type PersonHandler = (person: CompanyAdminManagePerson) => void;

interface Props {
  person: CompanyAdminManagePerson;
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

export function PersonRow({
  person,
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
    <div
      className="flex items-start sm:items-center justify-between border-t border-stroke-dimmed py-4 last:border-b"
      data-test-id={createTestId("person-row", person.id)}
    >
      <div className="flex items-start gap-2 sm:items-center sm:gap-4">
        <Avatar className="mt-0.5 sm:mt-0" person={person} size={48} />
        <PersonInfo person={person} />
      </div>

      <div className="flex gap-2 items-start sm:items-center">
        <div className="hidden sm:block">
          <InvitationStatus person={person} />
        </div>

        {!person.hasOpenInvitation && person.accessLevel !== undefined && showAccessLevelOptions && (
          <div className="hidden sm:block">
            <AccessLevelBadge accessLevel={person.accessLevel} />
          </div>
        )}

        <PersonOptions
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
      </div>
    </div>
  );
}

function PersonInfo({ person }: { person: CompanyAdminManagePerson }) {
  return (
    <div>
      <BlackLink to={person.profilePath} className="font-bold" underline="hover">
        {person.fullName}
      </BlackLink>

      <div className="flex flex-col sm:block text-content-dimmed text-sm">
        <span className="text-sm">{person.title}</span>
        <span className="text-sm hidden sm:inline"> &middot; </span>
        <span className="break-all mt-0.5">{person.email}</span>
      </div>
    </div>
  );
}

function InvitationStatus({ person }: { person: CompanyAdminManagePerson }) {
  if (person.invitationExpired) {
    return (
      <div className="text-content-error font-semibold flex items-center gap-2">
        <IconAlertTriangle size={20} />
        Invitation Expired
      </div>
    );
  }

  if (person.hasValidInvite && person.expiresIn) {
    return <div>Expires in {person.expiresIn}</div>;
  }

  return null;
}
