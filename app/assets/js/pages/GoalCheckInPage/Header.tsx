import * as React from "react";
import { IconSquareCheckFilled } from "turboui";

import { Avatar } from "turboui";
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
  assertPresent(update.insertedAt, "Update insertedAt must be defined");

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-content-accent text-xl sm:text-3xl font-extrabold text-center">
        Check-In for <FormattedTime time={update.insertedAt} format="long-date" />
      </h1>
      {update.state === "draft" && <DraftBadge />}
    </div>
  );
}

function Subtitle({ update }: { update: Update }) {
  assertPresent(update.author, "Update author must be defined");

  return (
    <div className="flex gap-1.5 items-center mt-1 font-medium text-sm sm:text-base">
      <AvatarAndName person={update.author} />
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
  if (update.state === "draft") {
    return <span className="flex items-center gap-1">Draft</span>;
  }

  if (update.acknowledgedAt) {
    return (
      <span className="flex items-center gap-1">
        <IconSquareCheckFilled size={16} className="text-accent-1" />
        <span className="hidden sm:inline">Acknowledged by</span>
        <span className="truncate">{update.acknowledgingPerson.fullName}</span>
      </span>
    );
  } else {
    return <span className="flex items-center gap-1">Not yet acknowledged</span>;
  }
}

function DraftBadge() {
  return (
    <span className="mt-2 rounded-sm border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold uppercase leading-none text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
      Draft
    </span>
  );
}
