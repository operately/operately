import React from "react";

import { Update } from "@/models/goalCheckIns";
import RichContent from "@/components/RichContent";

export function DescriptionSection({ update }: { update: Update }) {
  return (
    <div className="my-8">
      <div className="text-lg font-bold mx-auto">2. What's new since the last update?</div>

      <div className="mt-2 border border-stroke-base rounded p-4">
        <RichContent jsonContent={update.message!} className="text-lg" />
      </div>
    </div>
  );
}
