import * as React from "react";
import Avatar from "@/components/Avatar";
import { DimmedLink } from "@/components/Link";
import { DisableInEditMode } from "./DisableInEditMode";

export function Contributors({ goal }) {
  return (
    <DisableInEditMode>
      <div className="mt-6">
        <div className="mb-2 uppercase text-xs font-bold tracking-wider">Contributors</div>
        <div>
          <div className="flex items-center gap-0.5 flex-wrap">
            <Avatar person={goal.champion!} size={20} />
            <Avatar person={goal.reviewer!} size={20} />
            <Avatar person={goal.champion!} size={20} />
            <Avatar person={goal.reviewer!} size={20} />
            <Avatar person={goal.champion!} size={20} />
            <Avatar person={goal.reviewer!} size={20} />
            <Avatar person={goal.champion!} size={20} />
            <Avatar person={goal.reviewer!} size={20} />
            <Avatar person={goal.champion!} size={20} />
            <Avatar person={goal.reviewer!} size={20} />
            <Avatar person={goal.reviewer!} size={20} />
            <Avatar person={goal.reviewer!} size={20} />
            <Avatar person={goal.champion!} size={20} />
            <Avatar person={goal.reviewer!} size={20} />
            <Avatar person={goal.champion!} size={20} />
            <Avatar person={goal.reviewer!} size={20} />
            <Avatar person={goal.reviewer!} size={20} />
          </div>

          <div className="text-xs text-content-dimmed mt-3 mb-1">
            17 people contributed by working on related projects and sub-goals
          </div>

          <DimmedLink to="" className="text-xs">
            See how they contributed
          </DimmedLink>
        </div>
      </div>
    </DisableInEditMode>
  );
}
