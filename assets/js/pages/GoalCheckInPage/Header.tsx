import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Pages from "@/components/Pages";
import * as Timeframes from "@/utils/timeframes";

import Avatar from "@/components/Avatar";

import { useLoadedData } from "./loader";
import { assertPresent } from "@/utils/assertions";

import { Update } from "@/models/goalCheckIns";
import { BulletDot } from "@/components/TextElements";
import { Person } from "@/api";
import { GoalStatusBadge } from "@/features/goals/GoalStatusBadge";
import { Chronometer } from "@/components/Chronometer";

export function Header() {
  const { update } = useLoadedData();

  return (
    <div className="flex flex-col items-center">
      <div className="text-center">
        <Title update={update} />
      </div>

      <Subtitle update={update} />
    </div>
  );
}

function Title({ update }: { update: Update }) {
  assertPresent(update.insertedAt, "Update insertedAt must be defined");
  assertPresent(update.goal, "Update goal must be defined");

  return <span className="text-content-accent text-3xl font-extrabold">Check-In for August 2021</span>;
}

function Subtitle({ update }: { update: Update }) {
  assertPresent(update.author, "Update author must be defined");

  return (
    <div className="flex gap-1.5 items-center mt-1 font-medium">
      <AvatarAndName person={update.author} />
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

function Timeframe({ update }: { update: Update }) {
  const mode = Pages.usePageMode();
  const tf = Timeframes.parse(update.goal!.timeframe!);

  if (mode !== "view") return null;

  return (
    <div className="flex items-center mt-4">
      <Chronometer start={tf.startDate!} end={tf.endDate!} />
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
