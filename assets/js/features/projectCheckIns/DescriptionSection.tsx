import React from "react";

import RichContent from "@/components/RichContent";
import { ProjectCheckIn } from "@/models/projectCheckIns";

export function DescriptionSection({ checkIn }: { checkIn: ProjectCheckIn }) {
  return (
    <div className="my-8">
      <div className="text-lg font-bold mx-auto">2. What's new since the last check-in?</div>

      <div className="mt-2 border border-stroke-base rounded p-4">
        <RichContent jsonContent={checkIn.description!} className="text-lg" />
      </div>
    </div>
  );
}
