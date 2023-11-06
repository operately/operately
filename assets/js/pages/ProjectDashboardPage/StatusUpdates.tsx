import React from "react";

import * as UpdateContent from "@/graphql/Projects/update_content";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";

import { Summary } from "@/components/RichContent";
import { Indicator } from "@/components/ProjectHealthIndicators";

import { useNavigateTo } from "@/routes/useNavigateTo";

export default function StatusUpdate({ project }) {
  if (project.lastCheckIn == null) return null;

  const lastUpdate = project.lastCheckIn;
  const content = lastUpdate.content as UpdateContent.StatusUpdate;
  const author = lastUpdate.author;

  const gotoUpdate = useNavigateTo(`/projects/${project.id}/status_updates/${lastUpdate.id}`);
  const gotoUpdates = useNavigateTo(`/projects/${project.id}/status_updates`);

  return (
    <div className="flex-1">
      <div className="text-white-1/80 uppercase text-xs font-medium mb-2">Last Check-In</div>

      <div
        className="flex items-start gap-2 bg-dark-3 p-4 rounded-lg shadow-xl hover:bg-dark-4 cursor-pointer"
        onClick={gotoUpdate}
      >
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
          <div className="flex items-center gap-1">
            <Indicator value={content.health.status} type="status" />
          </div>

          <div className="flex items-center gap-1">
            <Indicator value={content.health.schedule} type="schedule" />
          </div>

          <div className="flex items-center gap-1">
            <Indicator value={content.health.budget} type="budget" />
          </div>

          <div className="flex items-center gap-1">
            <Indicator value={content.health.team} type="team" />
          </div>

          <div className="flex items-center gap-1">
            <Indicator value={content.health.risks} type="risks" />
          </div>
        </div>
      </div>

      <div className="underline cursor-pointer decoration-blue-400 text-blue-400 mt-2" onClick={gotoUpdates}>
        View all check-ins
      </div>
    </div>
  );
}
