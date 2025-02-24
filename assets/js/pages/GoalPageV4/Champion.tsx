import * as React from "react";
import Avatar from "@/components/Avatar";

export function Champion({ goal }) {
  return (
    <div className="mt-6">
      <div className="mb-2 uppercase text-xs font-bold tracking-wider">Champion</div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Avatar person={goal.champion!} size={20} /> {goal.champion!.fullName}
        </div>
      </div>
    </div>
  );
}
