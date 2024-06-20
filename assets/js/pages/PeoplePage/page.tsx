import * as React from "react";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import { Person } from "@/models/people";
import Avatar from "@/components/Avatar";
import { Link } from "@/components/Link";

export function Page() {
  const { company, people } = useLoadedData();

  return (
    <Pages.Page title={"People"}>
      <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 my-10">
        <div className="flex items-center gap-4 justify-center">
          <div className="font-medium">Employee List</div>
          <Link to="/people/org-chart">Org Chart</Link>
        </div>

        <h1 className="text-3xl font-bold text-center mt-2 mb-16">Members of {company.name}</h1>

        <PeopleList people={people} />
      </div>
    </Pages.Page>
  );
}

function PeopleList({ people }: { people: Person[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
      {people.map((person) => (
        <PersonCard key={person.id} person={person} />
      ))}
    </div>
  );
}

function PersonCard({ person }: { person: Person }) {
  const path = `/people/${person.id}`;

  return (
    <div className="bg-surface rounded shadow p-4 border border-stroke-base">
      <div className="flex items-start gap-4">
        <Avatar person={person} size={40} />

        <div className="flex flex-col">
          <div className="font-bold leading-tight">
            <Link to={path} underline={false}>
              {person.fullName}
            </Link>
          </div>
          <div className="font-medium text-sm text-content-dimmed">{person.title}</div>
        </div>
      </div>
    </div>
  );
}
