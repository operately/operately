import React from "react";

import { ProjectCheckIn } from "@/models/projectCheckIns";
import { RichContent, shortenContent } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

export function DescriptionSection({ checkIn, limit }: { checkIn: ProjectCheckIn; limit?: number }) {
  const message = limit ? shortenContent(checkIn.description!, limit, { suffix: "..." }) : checkIn.description!;
  const { mentionedPersonLookup } = useRichEditorHandlers();

  return (
    <div className="my-8">
      <div className="text-lg font-bold mx-auto">2. What's new since the last check-in?</div>

      <div className="mt-2 border border-stroke-base rounded p-4">
        <RichContent content={message} mentionedPersonLookup={mentionedPersonLookup} parseContent />
      </div>
    </div>
  );
}
