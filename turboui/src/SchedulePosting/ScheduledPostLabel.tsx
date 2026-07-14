import React from "react";

import { StatusBadge } from "../StatusBadge";

export function ScheduledPostLabel() {
  return <StatusBadge status="pending" customLabel="Scheduled" hideIcon className="scale-95 inline-block shrink-0" />;
}
