import React from "react";

import { Person } from "@/graphql/People";
import Avatar, { AvatarSize } from "@/components/Avatar";

function ChampionCrown() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="14" height="14" rx="3" fill="#3185FF" />
      <path
        d="M7 3.5L9.33333 7L12.25 4.66667L11.0833 10.5H2.91667L1.75 4.66667L4.66667 7L7 3.5Z"
        fill="#FFE600"
      />
    </svg>
  );
}

interface ChampionProps {
  person: Person;
}

function Champion({ person }: ChampionProps): JSX.Element {
  return (
    <div className="relative" style={{ marginRight: "10px" }}>
      <Avatar person={person} size={AvatarSize.Small} />

      <div className="absolute top-[-6px] left-[21px]">
        <ChampionCrown />
      </div>
    </div>
  );
}

interface AvatarList {
  champion: Person;
  people: Person[];
}

export function AvatarList({ champion, people }: AvatarList): JSX.Element {
  return (
    <div className="flex items-center">
      <Champion person={champion} />

      <div className="flex items-center">
        {people.map((person, index: number) => (
          <div
            key={index}
            className="border-2 border-white rounded-full -ml-[6px]"
          >
            <div
              className="rounded-full"
              style={{
                background: "#fafafa",
              }}
            >
              <Avatar person={person} size={AvatarSize.Small} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
