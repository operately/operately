import React from "react";
import * as Icons from "@tabler/icons-react";

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
