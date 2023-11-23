import * as React from "react";

import { GhostButton } from "@/components/Button";

export function Title({ milestone, form }) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="text-2xl font-extrabold text-content-accent hover:bg-shade-1 flex-1 -m-1.5 p-1.5">
        {milestone.title}
      </div>

      <GhostButton size="xs" onClick={form.completeMilestone} data-test-id="edit-milestone" type="secondary">
        Edit
      </GhostButton>
    </div>
  );
}
