import React from "react";

import { Avatar } from "../../Avatar";
import { BlackLink } from "../../Link";
import { CompanyAdminManagePerson } from "../types";
import { PersonActions } from "./PersonActions";
import { PersonOptions } from "./PersonOptions";

type PersonHandler = (person: CompanyAdminManagePerson) => void;

export function PersonRow({
  person,
  onOpenRemove,
  onOpenReissue,
  onOpenView,
  onOpenRenew,
}: {
  person: CompanyAdminManagePerson;
  onOpenRemove: PersonHandler;
  onOpenReissue: PersonHandler;
  onOpenView: PersonHandler;
  onOpenRenew: PersonHandler;
}) {
  return (
    <div className="flex items-center justify-between border-t border-stroke-dimmed py-4 last:border-b">
      <div className="flex items-center gap-4">
        <Avatar person={person} size={48} />
        <PersonInfo person={person} />
      </div>

      <div className="flex gap-2 items-center">
        {person.hasValidInvite && person.expiresIn && <ExpiresIn expiresIn={person.expiresIn} />}

        <PersonActions person={person} onOpenRenew={onOpenRenew} />
        <PersonOptions
          person={person}
          onOpenRemove={onOpenRemove}
          onOpenReissue={onOpenReissue}
          onOpenView={onOpenView}
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

      <div className="text-content-dimmed text-sm">
        <span className="text-sm">{person.title}</span>
        <span className="text-sm"> &middot; </span>
        <span className="break-all mt-0.5">{person.email}</span>
      </div>
    </div>
  );
}

function ExpiresIn({ expiresIn }: { expiresIn: string }) {
  return <div>Expires in {expiresIn}</div>;
}
