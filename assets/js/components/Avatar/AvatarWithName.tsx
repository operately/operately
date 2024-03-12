import * as React from "react";
import * as People from "@/models/people";

import Avatar from "@/components/Avatar";

interface AvatarWithNameProps {
  person: People.Person;
  size: "small" | "medium" | "large";
  nameFormat?: People.NameFormat;
}

export function AvatarWithName({ person, size, nameFormat = "full" }: AvatarWithNameProps) {
  return (
    <div className="flex items-center mt-4">
      <Avatar person={person} size={size} />
      <div className="ml-4 text-content-accent font-bold">{People.formattedName(person, nameFormat)}</div>
    </div>
  );
}
