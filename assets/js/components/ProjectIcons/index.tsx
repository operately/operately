import React from "react";

import * as Icons from "@tabler/icons-react";
import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

export function IconForPhase({ phase }): JSX.Element {
  switch (phase) {
    case "paused":
      return <IconPaused />;
    case "planning":
      return <IconPlanning />;
    case "execution":
      return <IconExecution />;
    case "control":
      return <IconControl />;
    case "completed":
      return <IconCompleted />;
    case "canceled":
      return <IconCanceled />;
    default:
      throw new Error("Invalid phase " + phase);
  }
}

export function IconForHealth({ health }): JSX.Element {
  switch (health) {
    case "on_track":
      return <IconOnTrack />;
    case "at_risk":
      return <IconAtRisk />;
    case "off_track":
      return <IconOffTrack />;
    case "unknown":
      return <IconUnknownHealth />;
    default:
      throw new Error("Invalid health " + health);
  }
}

export function IconUnknownHealth() {
  return (
    <div className="shrink-0">
      <Icons.IconActivityHeartbeat size={20} className="text-white-2" />
    </div>
  );
}

export function IconOnTrack() {
  return (
    <div className="shrink-0">
      <Icons.IconActivityHeartbeat size={20} className="text-green-400" />
    </div>
  );
}

export function IconAtRisk() {
  return (
    <div className="shrink-0">
      <Icons.IconAlertCircle size={20} className="text-yellow-400" />
    </div>
  );
}

export function IconOffTrack() {
  return (
    <div className="shrink-0">
      <Icons.IconAlertCircle size={20} className="text-red-400" />
    </div>
  );
}

export function IconPlanning() {
  return (
    <div className="shrink-0">
      <Icons.IconCircleDashed size={20} stroke={2} className="text-zinc-400/80" />
    </div>
  );
}

export function IconExecution() {
  return (
    <div className="shrink-0">
      <Icons.IconCircleHalf2 size={20} stroke={2} className="text-yellow-400/80" />
    </div>
  );
}

export function IconControl() {
  return (
    <div className="shrink-0">
      <Icons.IconCircleDotFilled size={20} stroke={2} className="text-green-400/80" />
    </div>
  );
}

export function IconCompleted() {
  return (
    <div className="shrink-0">
      <Icons.IconCircleCheckFilled size={20} stroke={2} className="text-green-400" />
    </div>
  );
}

export function IconPaused() {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: "16px",
        height: "16px",
        borderRadius: "100%",
        border: "1px solid var(--color-white-2)",
      }}
    >
      <div className="flex items-center justify-center gap-0.5">
        <div className="bg-white-2" style={{ height: "6px", width: "1.5px" }}></div>
        <div className="bg-white-2" style={{ height: "6px", width: "1.5px" }}></div>
      </div>
    </div>
  );
}

export function IconCanceled() {
  return (
    <div className="shrink-0">
      <Icons.IconCircleXFilled size={20} stroke={2} className="text-red-400" />
    </div>
  );
}

export function Champion({ person }): JSX.Element {
  if (!person) {
    return <div className="flex items-center gap-2 text-white-2">No Champion</div>;
  }

  const avatar = <Avatar person={person} size="tiny" />;
  const name = person.fullName.split(" ")[0];

  return (
    <div className="flex items-center gap-2">
      {avatar}
      {name}
    </div>
  );
}

export function Reviewer({ person }): JSX.Element {
  if (!person) {
    return <div className="flex items-center gap-2 text-white-2">No Reviwer</div>;
  }

  const avatar = <Avatar person={person} size="tiny" />;
  const name = person.fullName.split(" ")[0];

  return (
    <div className="flex items-center gap-2">
      {avatar}
      {name}
    </div>
  );
}

export function Contributors({ contributors }): JSX.Element {
  if (!contributors || contributors.length === 0) {
    return <div className="flex items-center gap-2 text-white-2">No Contributors</div>;
  }

  const firstFive = contributors.slice(0, 5);
  const restCount = contributors.length - 5;

  return (
    <div className="flex items-center gap-1">
      {firstFive.map((c) => (
        <Avatar key={c.id} person={c.person} size="tiny" />
      ))}
      {restCount > 0 && <div className="text-sm text-white-2">+{restCount}</div>}
    </div>
  );
}

export function Timeline({ project }): JSX.Element {
  const startedAt = project.startedAt;
  const deadline = project.deadline;

  return (
    <div className="text-sm flex items-center gap-2">
      {startedAt ? <FormattedTime time={startedAt} format="short-date" /> : <div className="text-white-2">Not Set</div>}
      <div>-&gt;</div>
      {deadline ? <FormattedTime time={deadline} format="short-date" /> : <div className="text-white-2">Not Set</div>}
    </div>
  );
}
