import React from "react";

import { useLoadedData } from "./loader";
import { Person } from "@/gql";
import Avatar from "@/components/Avatar";
import RemoveMember from "./RemoveMember";
import NewInvitationToken from "./NewInvitationToken";



export function PeopleList() {
  const { company } = useLoadedData();

  return (
    <div className="mt-8 grid grid-cols-3 gap-4">
      {company.people!.map((person) => (
        <PersonRow key={person!.id} person={person!} />
      ))}
    </div>
  );
}

function PersonRow({ person }: { person: Person }) {
  return (
    <div className="flex flex-col gap-4 items-center border border-stroke-base rounded-lg p-4 py-6">
      <Avatar person={person} size="xlarge" />

      <div className="flex flex-col text-center items-center">
        <div className="text-content-primary font-bold">{person.fullName}</div>
        <div className="text-content-secondary text-sm">{person.title}</div>
        <div className="text-content-secondary text-sm break-all">{person.email}</div>
      </div>

      <div className="flex flex-col gap-2">
        <RemoveMember person={person} />
        <NewInvitationToken person={person} />
      </div>
    </div>
  );
}
