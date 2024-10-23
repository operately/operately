import * as React from "react";
import * as People from "@/models/people";
import * as Paper from "@/components/PaperContainer";

import Avatar from "@/components/Avatar";

import { useLoadedData } from "./loader";

export function CompanyAdmins() {
  const { company } = useLoadedData();

  if (company.admins?.length === 0) return null;

  return (
    <Paper.Section title="Administrators">
      <PeopleList people={company.admins!} />
    </Paper.Section>
  );
}

export function CompanyOwners() {
  const { company } = useLoadedData();

  if (company.owners?.length === 0) return null;

  return (
    <Paper.Section title="Account Owners">
      <PeopleList people={company.owners!} />
    </Paper.Section>
  );
}

function PeopleList({ people }: { people: People.Person[] }) {
  return (
    <div className="flex flex-wrap gap-4">
      {people.map((owner) => (
        <Person key={owner!.id} person={owner!} />
      ))}
    </div>
  );
}

function Person({ person }: { person: People.Person }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar person={person} size="small" />
      <div className="font-medium">{person.fullName}</div>
    </div>
  );
}
