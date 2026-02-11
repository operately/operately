import * as Pages from "@/components/Pages";
import * as React from "react";

import { Person } from "@/models/people";
import { Avatar, Link } from "turboui";
import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";

export function Page() {
  const { company, people } = useLoadedData();

  return (
    <Pages.Page title={"People"}>
      <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 my-10">
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
  const paths = usePaths();
  const testId = "person-" + person.id!;

  return (
    <div className="bg-surface-base rounded shadow p-4 border border-stroke-base">
      <div className="flex items-start gap-4">
        <Avatar person={person} size={40} />

        <div className="flex flex-col">
          <div className="font-bold leading-tight">
            <Link to={paths.profilePath(person.id!!)} underline="never" testId={testId}>
              {person.fullName}
            </Link>
          </div>
          <div className="font-medium text-sm text-content-dimmed">{person.title}</div>
        </div>
      </div>
    </div>
  );
}
