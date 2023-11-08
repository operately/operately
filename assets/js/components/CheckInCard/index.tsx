import * as React from "react";

import * as UpdateContent from "@/graphql/Projects/update_content";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";

import { Summary } from "@/components/RichContent";
import { Indicator } from "@/components/ProjectHealthIndicators";

import { useNavigateTo } from "@/routes/useNavigateTo";

export function CheckInCard({ update }) {
  const content = update.content as UpdateContent.StatusUpdate;
  const author = update.author;

  const gotoUpdate = useNavigateTo(`/projects/${update.updatableId}/status_updates/${update.id}`);
  const health = content.health || defaultHealth;

  return (
    <div
      className="flex items-start gap-2 p-4 rounded-lg cursor-pointer border border-surface-outline bg-surface-accent"
      onClick={gotoUpdate}
    >
      <div className="flex flex-col gap-1 relative flex-1">
        <div className="flex items-center justify-between flex-1">
          <div className="flex items-center gap-2">
            <Avatar person={author} size="tiny" />
            <span className="font-bold text-content-accent">{author.fullName}</span>
          </div>

          <span className="text-content-dimmed text-sm">
            <FormattedTime time={update.insertedAt} format="short-date" />
          </span>
        </div>

        <div className="flex-1">
          <Summary jsonContent={content.message} characterCount={250} />
        </div>
      </div>

      <div className="flex flex-col gap-1 border-l border-surface-outline pl-3 ml-3 w-1/3">
        <div className="flex items-center gap-1">
          <Indicator value={health.status} type="status" />
        </div>

        <div className="flex items-center gap-1">
          <Indicator value={health.schedule} type="schedule" />
        </div>

        <div className="flex items-center gap-1">
          <Indicator value={health.budget} type="budget" />
        </div>

        <div className="flex items-center gap-1">
          <Indicator value={health.team} type="team" />
        </div>

        <div className="flex items-center gap-1">
          <Indicator value={health.risks} type="risks" />
        </div>
      </div>
    </div>
  );
}

const defaultHealth = {
  status: "on_track",
  schedule: "on_schedule",
  budget: "within_budget",
  team: "staffed",
  risks: "no_known_risks",
};
