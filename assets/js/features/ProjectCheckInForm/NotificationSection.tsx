import React from "react";

import Avatar from "@/components/Avatar";

import * as People from "@/models/people";
import * as Projects from "@/models/projects";

import { FormState } from "./useForm";

export function NotificationSection({ form }: { form: FormState }) {
  const regularContributors = form.project.contributors!.filter(
    (contrib) => contrib!.role !== "reviewer" && contrib!.person.id !== form.author.id,
  );

  return (
    <div className="mt-10 font-medium">
      <p className="font-bold text-lg">When you submit this check-in:</p>

      <div className="mt-2 gap-2 flex flex-col">
        <WhoWillBeNotified contributors={regularContributors} />
        <WhoWillNeedToAcknowledge reviewer={form.project.reviewer!} />
      </div>
    </div>
  );
}

function WhoWillNeedToAcknowledge({ reviewer }: { reviewer: People.Person }) {
  if (!reviewer) return null;

  return (
    <div className="inline-flex gap-1 flex-wrap">
      The project reviewer <PersonWithAvatarAndName person={reviewer} /> will be asked to acknowledge the check-in.
    </div>
  );
}

function WhoWillBeNotified({ contributors }: { contributors: Projects.Project["contributors"] }) {
  if (!contributors) return null;
  if (contributors.length === 0) return null;

  const people = contributors.map((contrib) => contrib!.person!);

  return (
    <div className="inline-flex flex-wrap">
      <PeopleList people={people} />
      &nbsp;will be notified.
    </div>
  );
}

function PeopleList({ people }: { people: People.Person[] }): JSX.Element {
  return (
    <>
      {people.map((p, index) => (
        <React.Fragment key={p.id}>
          <PersonWithAvatarAndName key={p.id} person={p} />
          <PeopleListSeparator index={index} total={people.length} />
        </React.Fragment>
      ))}
    </>
  );
}

type PersonNameFormat = "first" | "short" | "full";

function PersonWithAvatarAndName({ person, nameFormat }: { person: People.Person; nameFormat?: PersonNameFormat }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <Avatar person={person} size={18} />
      {formatName(person, nameFormat || "first")}
    </div>
  );
}

function formatName(person: People.Person, nameFormat: "first" | "short" | "full"): string {
  if (nameFormat === "first") return People.firstName(person);
  if (nameFormat === "short") return People.shortName(person);
  if (nameFormat === "full") return person.fullName;

  throw new Error(`Invalid name format: ${nameFormat}`);
}

// Separate with commas and "and" for the last person, e.g. "Alice, Bob, and Charlie"
function PeopleListSeparator({ index, total }: { index: number; total: number }) {
  // If there's only one person, don't add a separator
  if (total === 1) return null;

  // Don't add a separator after the last person
  if (index === total - 1) return null;

  // Add " and " before the last person
  if (index === total - 2) return <>&nbsp;and&nbsp;</>;

  // Otherwise, use a comma between people, .e.g. "Alice, Bob, "
  return <>,&nbsp;</>;
}
