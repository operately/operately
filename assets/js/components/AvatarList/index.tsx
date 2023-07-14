import React from "react";

import { Person } from "@/graphql/People";
import Avatar, { AvatarSize } from "@/components/Avatar";

export default function AvatarList({ people }: { people: Person[] }): JSX.Element {
  return (
    <div className="flex items-center">
      <div className="flex items-center gap-1.5">
        {people.map((person, index: number) => (
          <div key={index}>
            <Avatar person={person} size={AvatarSize.Tiny} />
          </div>
        ))}
      </div>
    </div>
  );
}
