import React from "react";

import { SmallStatusIndicator } from "@/features/projectCheckIns/SmallStatusIndicator";

export function StatusIndicator({ project }) {
  if (project.status === "closed") return null;
  if (project.status === "paused") return <SmallStatusIndicator status="paused" />;
  if (project.isOutdated) return <SmallStatusIndicator status="outdated" />;

  return <SmallStatusIndicator status={project.lastCheckIn?.status || "on_track"} />;
}
