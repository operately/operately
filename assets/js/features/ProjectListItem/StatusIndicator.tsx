import React from "react";

import { SmallStatusIndicator } from "@/features/projectCheckIns/SmallStatusIndicator";
import { Project } from "@/models/projects";

type Size = "std" | "sm";
interface StatusIndicatorProps {
  project: Project;
  size?: Size;
  textClassName?: string;
}

export function StatusIndicator({ project, size = "std", textClassName }: StatusIndicatorProps) {
  if (project.status === "closed") return null;
  if (project.status === "paused")
    return <SmallStatusIndicator status="paused" size={size} textClassName={textClassName} />;
  if (project.isOutdated) return <SmallStatusIndicator status="outdated" size={size} textClassName={textClassName} />;

  return (
    <SmallStatusIndicator
      status={project.lastCheckIn?.status || "on_track"}
      size={size}
      textClassName={textClassName}
    />
  );
}
