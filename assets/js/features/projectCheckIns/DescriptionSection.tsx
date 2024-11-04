import React from "react";

import RichContent, { shortenContent } from "@/components/RichContent";
import { ProjectCheckIn } from "@/models/projectCheckIns";

export function DescriptionSection({ checkIn, limit }: { checkIn: ProjectCheckIn; limit?: number }) {
  const message = limit ? shortenContent(checkIn.description!, limit, { suffix: "..." }) : checkIn.description!;

  return (
    <div className="my-8">
      <div className="text-lg font-bold mx-auto">2. What's new since the last check-in?</div>

      <div className="mt-2 border border-stroke-base rounded p-4">
        <RichContent jsonContent={message} />
      </div>
    </div>
  );
}
