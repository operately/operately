import React from "react";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { CheckInCard } from "@/components/CheckInCard";

export default function StatusUpdate({ project }) {
  if (project.lastCheckIn == null) return null;

  const lastUpdate = project.lastCheckIn;
  const gotoUpdates = useNavigateTo(`/projects/${project.id}/status_updates`);

  return (
    <div className="flex-1">
      <div className="text-white-1/80 uppercase text-xs font-medium mb-2">Last Check-In</div>

      <CheckInCard update={lastUpdate} />

      <div className="underline cursor-pointer decoration-blue-400 text-blue-400 mt-2" onClick={gotoUpdates}>
        View all check-ins
      </div>
    </div>
  );
}
