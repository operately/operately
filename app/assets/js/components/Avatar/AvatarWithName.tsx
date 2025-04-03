import * as React from "react";
import * as People from "@/models/people";

import Avatar from "@/components/Avatar";

interface AvatarWithNameProps {
  person: People.Person;
  size: number;
  nameFormat?: People.NameFormat;
}

export function AvatarWithName({ person, size, nameFormat = "full" }: AvatarWithNameProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Avatar person={person} size={size} />
      <div>{People.formattedName(person, nameFormat)}</div>
    </div>
  );
}
