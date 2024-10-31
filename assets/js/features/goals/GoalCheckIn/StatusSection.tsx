import React from "react";

import { Update } from "@/models/goalCheckIns";
import { Person } from "@/models/people";
import { Status, StatusOptions } from "@/components/status";

interface StatusSectionProps {
  update: Update;
  reviewer?: Person | null;
}

export function StatusSection({ update, reviewer }: StatusSectionProps) {
  return (
    <div className="my-8">
      <div className="text-lg font-bold mx-auto">1. How's the goal going?</div>

      <div className="flex flex-col gap-2 mt-2 border border-stroke-base rounded-lg p-2">
        <Status status={update.status as StatusOptions} reviewer={reviewer} />
      </div>
    </div>
  );
}
