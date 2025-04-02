import React from "react";

import RichContent, { countCharacters, shortenContent } from "@/components/RichContent";
import { ProjectCheckIn } from "@/models/projectCheckIns";

const DESCRIPTION_CHAR_LIMIT = 250;

export function DescriptionSection({ checkIn, limit }: { checkIn: ProjectCheckIn; limit?: number }) {
  const message = limit ? shortenContent(checkIn.description!, limit, { suffix: "..." }) : checkIn.description!;
  const [showMore, setShowMore] = React.useState(false);

  const length = React.useMemo(() => {
    return message ? countCharacters(message) : 0;
  }, [message]);

  const description = React.useMemo(() => {
    if (length <= DESCRIPTION_CHAR_LIMIT) {
      return message;
    } else if (showMore) {
      return message;
    } else {
      return shortenContent(message, DESCRIPTION_CHAR_LIMIT, { suffix: "..." });
    }
  }, [length, showMore, message]);

  return (
    <div className="my-8">
      <div className="text-lg font-bold mx-auto">2. What's new since the last check-in?</div>

      <div className="mt-2 border border-stroke-base rounded p-4">
        <RichContent jsonContent={description} />
        {length > DESCRIPTION_CHAR_LIMIT && <ExpandCollapseButton showMore={showMore} setShowMore={setShowMore} />}
      </div>
    </div>
  );
}

function ExpandCollapseButton({ showMore, setShowMore }) {
  return (
    <span
      onClick={() => setShowMore(!showMore)}
      className="text-sm text-link-base underline underline-offset-2 cursor-pointer"
      data-test-id="expand-project-description"
    >
      {showMore ? "Collapse" : "Expand"}
    </span>
  );
}
