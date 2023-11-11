import React from "react";

import { Link } from "@/components/Link";
import { CheckInCard } from "@/components/CheckInCard";

export default function StatusUpdate({ project }) {
  if (project.lastCheckIn == null) return null;

  const lastUpdate = project.lastCheckIn;
  const seeAllPath = `/projects/${project.id}/status_updates`;

  return (
    <div className="flex-1">
      <div className="text-content-accent font-bold uppercase text-xs mb-2">Last Check-In</div>

      <CheckInCard update={lastUpdate} />

      <div className="mt-2">
        <Link to={seeAllPath}>View all check-ins</Link>
      </div>
    </div>
  );
}
