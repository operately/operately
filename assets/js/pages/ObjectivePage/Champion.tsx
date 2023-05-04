import React from "react";
import Avatar from "../../components/Avatar";

interface Person {
  fullName: string;
  avatarUrl?: string;
  title: string;
  id: string;
}

export default function Champion({ person }: { person: Person }): JSX.Element {
  return (
    <div className="mt-4 flex gap-2 items-center">
      <div>
        <div className="font-bold">{person.fullName}</div>
        <div className="text-sm">{person.title}</div>
      </div>
      <Avatar person={person} />
    </div>
  );
}
