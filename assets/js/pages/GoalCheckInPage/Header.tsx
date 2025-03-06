import * as React from "react";
import * as Icons from "@tabler/icons-react";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

import { useLoadedData } from "./loader";
import { assertPresent } from "@/utils/assertions";

import { Update } from "@/models/goalCheckIns";
import { BulletDot } from "@/components/TextElements";
import { Person } from "@/api";

export function Header() {
  const { update } = useLoadedData();

  return (
    <div className="flex flex-col items-center">
      <Title update={update} />
      <Subtitle update={update} />
    </div>
  );
}

function Title({ update }: { update: Update }) {
  return (
    <div className="text-content-accent text-3xl font-extrabold">
      Check-In
      <span
        className="ml-2 bg-green-200 px-2 py-1 text-xs uppercase font-semibold inline-block rounded-full"
        style={{ verticalAlign: "5px" }}
      >
        On Track
      </span>
    </div>
  );
}

function Subtitle({ update }: { update: Update }) {
  assertPresent(update.author, "Update author must be defined");
  assertPresent(update.insertedAt, "Update insertedAt must be defined");

  return (
    <div className="flex gap-1.5 items-center mt-1 font-medium">
      <AvatarAndName person={update.author} />
      <BulletDot />
      <FormattedTime time={update.insertedAt} format="long-date" />
      <BulletDot />
      <Acknowledgement update={update} />
    </div>
  );
}

function AvatarAndName({ person }: { person: Person }) {
  return (
    <div className="flex items-center gap-1">
      <Avatar person={person} size="tiny" /> {person.fullName}
    </div>
  );
}

function Acknowledgement({ update }) {
  if (update.acknowledgedAt) {
    return (
      <span className="flex items-center gap-1">
        <Icons.IconSquareCheckFilled size={16} className="text-accent-1" />
        Acknowledged by {update.acknowledgingPerson.fullName}
      </span>
    );
  } else {
    return <span className="flex items-center gap-1">Not yet acknowledged</span>;
  }
}
