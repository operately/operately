import { useTaskList } from "@/models/richContent/taskListLifecycle";
import { useMe } from "@/contexts/CurrentCompanyContext";
import React from "react";

import { ProjectCheckIn, canEditProjectCheckIn } from "@/models/projectCheckIns";
import { RichContent, shortenContent } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

export function DescriptionSection({ checkIn, limit }: { checkIn: ProjectCheckIn; limit?: number }) {
  const source = JSON.parse(checkIn.description ?? "{}");
  const message = limit ? shortenContent(source, limit, { suffix: "...", skipParse: true }) : source;
  const { mentionedPersonLookup } = useRichEditorHandlers();
  const me = useMe();
  const taskList = useTaskList({
    resourceType: "project_check_in",
    resourceId: checkIn.id,
    field: "description",
    canEdit: !limit && canEditProjectCheckIn(checkIn, me?.id),
  });

  return (
    <div className="my-8">
      <div className="text-lg font-bold mx-auto">2. What's new since the last check-in?</div>

      <div className="mt-2 border border-stroke-base rounded p-4">
        <RichContent
          taskList={limit ? { canEdit: false } : taskList}
          content={message}
          mentionedPersonLookup={mentionedPersonLookup}
        />
      </div>
    </div>
  );
}
