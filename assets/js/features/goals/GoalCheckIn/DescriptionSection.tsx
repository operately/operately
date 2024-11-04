import React from "react";

import { Update } from "@/models/goalCheckIns";
import RichContent, { shortenContent } from "@/components/RichContent";

export function DescriptionSection({ update, limit }: { update: Update; limit?: number }) {
  const message = limit ? shortenContent(update.message!, limit, { suffix: "..." }) : update.message!;

  return (
    <div className="my-8">
      <div className="text-lg font-bold mx-auto">2. What's new since the last update?</div>

      <div className="mt-2 border border-stroke-base rounded p-4">
        <RichContent jsonContent={message} />
      </div>
    </div>
  );
}
