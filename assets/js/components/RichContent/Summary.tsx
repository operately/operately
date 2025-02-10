import * as React from "react";

import { useSumarizedContent } from "./contentOps";
import RichContent from ".";

interface SummaryProps {
  jsonContent: string;
  characterCount: number;
}

export function Summary({ jsonContent, characterCount }: SummaryProps) {
  const summary = useSumarizedContent(jsonContent, characterCount);

  return (
    <div>
      <RichContent jsonContent={summary} />
    </div>
  );
}
