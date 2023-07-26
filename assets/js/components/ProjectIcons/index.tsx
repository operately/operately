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

export function IconPlanning() {
  return (
    <div
      style={{
        width: "16px",
        height: "16px",
        borderRadius: "100%",
        border: "2px solid #fff",
      }}
    ></div>
  );
}

export function IconExecution() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: "16px",
        height: "16px",
        borderRadius: "100%",
        border: "2px solid var(--color-yellow-400)",
        color: "var(--color-yellow-400)",
      }}
    >
      <Icons.IconChevronRight size={10} stroke={5} style={{ marginLeft: "1px" }} />
    </div>
  );
}

export function IconControl() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: "16px",
        height: "16px",
        borderRadius: "100%",
        border: "2px solid var(--color-orange-400)",
        color: "var(--color-orange-400)",
      }}
    >
      <Icons.IconDots size={10} stroke={5} />
    </div>
  );
}

export function IconCompleted() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: "16px",
        height: "16px",
        borderRadius: "100%",
        border: "2px solid var(--color-green-400)",
        color: "var(--color-green-400)",
      }}
    >
      <Icons.IconCheck size={10} stroke={5} />
    </div>
  );
}

export function IconPaused() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: "16px",
        height: "16px",
        borderRadius: "100%",
        border: "2px solid var(--color-white-2)",
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
    <div
      className="flex items-center justify-center"
      style={{
        width: "16px",
        height: "16px",
        borderRadius: "100%",
        border: "2px solid var(--color-white-2)",
        color: "var(--color-white-2)",
      }}
    >
      <Icons.IconX size={10} stroke={5} />
    </div>
  );
}
