import React from "react";

import * as Icons from "@tabler/icons-react";

import { Activity, ActivityContentGoalClosing } from "@/models/activities";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import RichContent, { Summary } from "@/components/RichContent";

export function PageTitle(_props: { activity: any }) {
  return <>Goal closed</>;
}

export function PageContent({ activity }: { activity: Activity }) {
  const content = activity.content as ActivityContentGoalClosing;

  return (
    <div>
      <div className="flex items-center gap-3">
        {content.success === "yes" ? <AcomplishedBadge /> : <FailedBadge />}
      </div>

      {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
        <div className="mt-4">
          <RichContent jsonContent={activity.commentThread.message} />
        </div>
      )}
    </div>
  );
}

export function FeedItemContent({ activity }: { activity: Activity }) {
  const content = activity.content as ActivityContentGoalClosing;

  return (
    <div>
      <div className="flex items-center gap-3 my-2">
        {content.success === "yes" ? <AcomplishedBadge /> : <FailedBadge />}
      </div>

      {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
        <div className="mt-2">
          <Summary jsonContent={activity.commentThread.message} characterCount={300} />
        </div>
      )}
    </div>
  );
}

function AcomplishedBadge() {
  return (
    <div className="flex items-center gap-1 bg-green-500/20 rounded-xl py-0.5 px-2 pr-3 text-green-800">
      <Icons.IconCheck size={16} />
      <div className="text-sm font-medium">Marked as accomplished</div>
    </div>
  );
}

function FailedBadge() {
  return (
    <div className="flex items-center gap-1 bg-red-500/20 rounded-xl py-0.5 px-2 pr-3 text-red-800">
      <Icons.IconX size={16} />
      <div className="text-sm font-medium">Marked as not accomplished</div>
    </div>
  );
}
