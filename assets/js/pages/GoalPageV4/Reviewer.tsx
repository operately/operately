import * as React from "react";
import Avatar from "@/components/Avatar";

export function Reviewer({ goal }) {
  return (
    <div className="mt-6">
      <div className="mb-2 uppercase text-xs font-bold tracking-wider">Reviewer</div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Avatar person={goal.reviewer!} size={20} /> {goal.reviewer!.fullName}
        </div>
      </div>
    </div>
  );
}
