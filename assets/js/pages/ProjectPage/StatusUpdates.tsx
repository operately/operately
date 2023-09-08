import React from "react";

import * as Icons from "@tabler/icons-react";
import { Link } from "react-router-dom";
import RichContent from "@/components/RichContent";
import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import Button from "@/components/Button";
import { useNavigate } from "react-router-dom";
import * as Projects from "@/graphql/Projects";
import * as Time from "@/utils/time";

import * as UpdateContent from "@/graphql/Projects/update_content";

export default function StatusUpdates({ project, me, refetch }) {
  const navigate = useNavigate();
  const gotoNewStatusUpdate = () => navigate(`/projects/${project.id}/updates/new?messageType=status_update`);

  return (
    <div className="my-8">
      <div className="font-extrabold text-lg text-white-1 leading-snug">Status Updates</div>
      <div className="text-white-2 max-w-xl">Asking the champion for a status update every Friday.</div>

      <LastStatusUpdate project={project} />

      <div className="mt-4 flex items-center gap-4">
        <Button variant="secondary" onClick={gotoNewStatusUpdate} data-test-id="add-status-update">
          Post Status Update
        </Button>
        <a className="text-blue-400 underline cursor-pointer">See all status updates</a>
      </div>
    </div>
  );
}

function LastStatusUpdate({ project }: { project: Projects.Project }) {
  const lastUpdate = project.updates.filter((update) => update.messageType === "status_update")[0];
  if (!lastUpdate) return null;

  const content = lastUpdate.content as UpdateContent.StatusUpdate;

  return (
    <div className="flex flex-col rounded-lg bg-dark-3 mt-4 shadow-lg border border-shade-1">
      <div className="flex items-start">
        <div className="max-w-xl flex-1 p-4">
          <div className="rounded-lg ">
            <div className="font-bold text-white-1 mb-2">Last Update</div>
            <RichContent jsonContent={lastUpdate.content["message"]} />
          </div>
        </div>

        <div className="ml-4 p-4 text-sm flex flex-col gap-4 border-l border-shade-2 h-full">
          <div className="">
            <div className="font-bold text-white-1">Health</div>
            <div>
              {content.newHealth
                .split("_")
                .map((word) => word[0].toUpperCase() + word.slice(1))
                .join(" ")}
            </div>
          </div>

          <div className="">
            <div className="font-bold text-white-1">Phase</div>
            <div className="capitalize">{content.phase}</div>
          </div>

          <div className="">
            <div className="font-bold text-white-1">Next Milestone</div>
            <div className="capitalize">{content.nextMilestoneTitle || "No upcomming milestone"}</div>
          </div>

          <div className="">
            <div className="font-bold text-white-1">Posted</div>

            <div className="flex items-center gap-2">
              <FormattedTime time={lastUpdate.insertedAt} format="relative" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
