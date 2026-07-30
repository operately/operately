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

export function PeopleList({ people }: { people: Person[] }) {
  return (
    <ul className="flex flex-col divide-y divide-stroke-base border-y border-stroke-base">
      {people.map((person) => (
        <PersonRow key={person.id} person={person} />
      ))}
    </ul>
  );
}

function PersonRow({ person }: { person: Person }) {
  const paths = usePaths();
  const testId = "person-" + person.id!;

  return (
    <li className="flex items-center gap-4 py-3">
      <Avatar person={person} size={40} />

      <div className="flex flex-col">
        <div className="font-bold leading-tight">
          <Link to={paths.profilePath(person.id!!)} underline="never" testId={testId}>
            {person.fullName}
          </Link>
        </div>
        <div className="font-medium text-sm text-content-dimmed">{person.title}</div>
      </div>
    </li>
  );
}
