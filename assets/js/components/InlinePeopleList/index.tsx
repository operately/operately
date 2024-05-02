import * as React from "react";
import * as People from "@/models/people";

import Avatar from "@/components/Avatar";

interface InlinePeopleListProps {
  people: People.Person[];
  nameFormat?: People.NameFormat;
}

export function InlinePeopleList({ people, nameFormat }: InlinePeopleListProps) {
  return (
    <>
      {people.map((p, index) => (
        <React.Fragment key={p.id}>
          <PersonWithAvatarAndName key={p.id} person={p} nameFormat={nameFormat} />
          <PeopleListSeparator index={index} total={people.length} />
        </React.Fragment>
      ))}
    </>
  );
}

function PersonWithAvatarAndName({ person, nameFormat }: { person: People.Person; nameFormat?: People.NameFormat }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <Avatar person={person} size={18} />
      {People.formattedName(person, nameFormat || "first")}
    </div>
  );
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
