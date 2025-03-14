import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Pages from "@/components/Pages";
import * as Timeframes from "@/utils/timeframes";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

import { useLoadedData } from "./loader";
import { assertPresent } from "@/utils/assertions";

import { Update } from "@/models/goalCheckIns";
import { BulletDot } from "@/components/TextElements";
import { Person } from "@/api";
import { Chronometer } from "@/components/Chronometer";

export function Header() {
  const { update } = useLoadedData();

  return (
    <div className="flex flex-col items-center">
      <Title update={update} />
      <Subtitle update={update} />
      <Timeframe update={update} />
    </div>
  );
}

function Title({ update }: { update: Update }) {
  assertPresent(update.insertedAt, "Update insertedAt must be defined");

  return (
    <span className="text-content-accent text-3xl font-extrabold text-center">
      Check-In for <FormattedTime time={update.insertedAt} format="long-date" />
    </span>
  );
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
