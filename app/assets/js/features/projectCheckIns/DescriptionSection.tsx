import React from "react";

import RichContent from "@/components/RichContent";
import { ProjectCheckIn } from "@/models/projectCheckIns";
import { shortenContent } from "turboui";

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
