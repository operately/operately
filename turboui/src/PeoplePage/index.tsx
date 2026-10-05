import React from "react";
import { useTranslation } from "react-i18next";
import type { Person } from "../ApiTypes";
import { Avatar } from "../Avatar";
import { Link } from "../Link";

export namespace PeoplePage {
  export interface Props {
    companyName: string;
    people: Person[];
    profileHref: (id: string) => string;
  }
}

export function PeoplePage({ companyName, people, profileHref }: PeoplePage.Props) {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 my-10">
      <h1 className="text-3xl font-bold text-center mt-2 mb-16">
        {t("Members of {{company}}", { company: companyName })}
      </h1>

      <PeopleList people={people} profileHref={profileHref} />
    </div>
  );
}

function PeopleList({ people, profileHref }: Pick<PeoplePage.Props, "people" | "profileHref">) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
      {people.map((person) => (
        <PersonCard key={person.id} person={person} profileHref={profileHref} />
      ))}
    </div>
  );
}

function PersonCard({ person, profileHref }: { person: Person; profileHref: PeoplePage.Props["profileHref"] }) {
  const testId = "person-" + person.id;

  return (
    <div className="bg-surface-base rounded shadow p-4 border border-stroke-base">
      <div className="flex items-start gap-4">
        <Avatar person={person} size={40} />

        <div className="flex flex-col">
          <div className="font-bold leading-tight">
            <Link to={profileHref(person.id)} underline="never" testId={testId}>
              {person.fullName}
            </Link>
          </div>
          <div className="font-medium text-sm text-content-dimmed">{person.title}</div>
        </div>
      </div>
    </div>
  );
}
