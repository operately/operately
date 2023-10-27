import React from "react";

import * as Updates from "@/graphql/Projects/updates";
import * as UpdateContent from "@/graphql/Projects/update_content";
import * as Icons from "@tabler/icons-react";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";
import { Summary } from "@/components/RichContent";

export default function Reviews({ me, project }) {
  const { updates, loading, error } = useStatusUpdates({ project });

  if (loading) return <div></div>;
  if (error) return <div></div>;

  const lastUpdate = updates[updates.length - 1];
  if (!lastUpdate) return <div></div>;

  const content = lastUpdate.content as UpdateContent.StatusUpdate;
  const author = lastUpdate.author;

  return (
    <div className="flex-1">
      <div className="text-white-1/80 uppercase text-xs font-medium mb-2">Last Check-In</div>

      <div className="flex items-start gap-2 bg-dark-3 p-4 rounded-lg shadow-xl hover:bg-dark-4 cursor-pointer">
        <div className="flex flex-col gap-1 relative flex-1">
          <div className="flex items-center justify-between flex-1">
            <div className="flex items-center gap-2">
              <Avatar person={author} size="tiny" />
              <span className="font-medium text-white-1">{author.fullName}</span>
            </div>

            <span className="text-white-2 text-sm">
              <FormattedTime time={lastUpdate.insertedAt} format="short-date" />
            </span>
          </div>

          <div className="flex-1">
            <Summary jsonContent={content.message} characterCount={100} />
          </div>
        </div>
        <div className="flex flex-col gap-1 border-l border-shade-3 pl-3 ml-3">
          <div className="mb-2">
            <HealthIndicator health={content.newHealth} />
          </div>

          <div className="">
            Is the project on schedule? -&gt; <span className="font-medium text-green-400">Yes</span>
          </div>
          <div className="">
            Is the project on within budget? -&gt; <span className="font-medium text-green-400">Yes</span>
          </div>
          <div className="">
            Is the team staffed with suitable roles? -&gt; <span className="font-medium text-red-400">No</span>
          </div>
          <div className="">
            Are there any outstanding project risks? -&gt; <span className="font-medium text-red-400">Yes</span>
          </div>
        </div>
      </div>

      <div className="underline cursor-pointer decoration-blue-400 text-blue-400 mt-2">View all check-ins</div>
    </div>
  );
}

function HealthIndicator({ health }) {
  const colors = {
    on_track: "text-green-400",
    at_risk: "text-yellow-400",
    off_track: "text-red-400",
  };

  const color = colors[health];
  const title = health.replace("_", " ");

  return (
    <div>
      <div className="font-medium flex items-center gap-1">
        <Icons.IconCircleFilled size={12} className={color} />
        <span className="font-medium capitalize">{title}</span>
      </div>
    </div>
  );
}

function useStatusUpdates({ project }): { updates: Updates.Update[]; loading: boolean; error: any } {
  const { data, loading, error } = Updates.useListUpdates({
    fetchPolicy: "network-only",
    variables: {
      filter: {
        projectId: project.id,
      },
    },
  });

  if (loading) {
    return { loading, error, updates: [] };
  }

  let updates = data.updates as Updates.Update[];
  updates = Updates.filterByType(updates, "status_update");
  updates = Updates.sortByDate(updates);

  return { updates: updates, loading, error };
}
