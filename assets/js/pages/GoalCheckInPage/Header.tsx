import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Pages from "@/components/Pages";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

import { useLoadedData } from "./loader";
import { assertPresent } from "@/utils/assertions";

import { Update } from "@/models/goalCheckIns";
import { BulletDot } from "@/components/TextElements";
import { Person } from "@/api";
import { GoalStatusBadge } from "@/features/goals/GoalStatusBadge";

export function Header() {
  const { update } = useLoadedData();

  return (
    <div className="flex flex-col items-center">
      <div className="text-center">
        <Title update={update} />
        <Status update={update} />
      </div>

      <Subtitle update={update} />
    </div>
  );
}

function Title({ update }: { update: Update }) {
  assertPresent(update.insertedAt, "Update insertedAt must be defined");
  assertPresent(update.goal, "Update goal must be defined");

  return <span className="text-content-accent text-3xl font-extrabold">Check-In: {update.goal.name}</span>;
}

function Subtitle({ update }: { update: Update }) {
  assertPresent(update.author, "Update author must be defined");

  return (
    <div className="flex gap-1.5 items-center mt-1 font-medium">
      <AvatarAndName person={update.author} />
      <BulletDot />
      <FormattedTime time={update.insertedAt!} format="relative" />
      <BulletDot />
      <Acknowledgement update={update} />
    </div>
  );
}

function Status({ update }: { update: Update }) {
  const mode = Pages.usePageMode();

  if (mode === "view") {
    return <GoalStatusBadge status={update.status!} className="inline-block ml-2 align-[5px]" />;
  } else {
    return null;
  }
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
