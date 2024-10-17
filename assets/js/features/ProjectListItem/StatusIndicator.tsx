import React from "react";

import { SmallStatusIndicator } from "@/features/projectCheckIns/SmallStatusIndicator";
import { Project } from "@/models/projects";

type Size = "std" | "sm";

export function StatusIndicator({ project, size = "std" }: { project: Project; size?: Size }) {
  if (project.status === "closed") return null;
  if (project.status === "paused") return <SmallStatusIndicator status="paused" size={size} />;
  if (project.isOutdated) return <SmallStatusIndicator status="outdated" size={size} />;

  return <SmallStatusIndicator status={project.lastCheckIn?.status || "on_track"} size={size} />;
}
