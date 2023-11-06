import React from "react";

import * as Updates from "@/graphql/Projects/updates";
import * as UpdateContent from "@/graphql/Projects/update_content";
import * as Icons from "@tabler/icons-react";
import * as Project from "@/graphql/Projects";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import { Spacer } from "@/components/Spacer";

import { useNavigateTo } from "@/routes/useNavigateTo";
import classnames from "classnames";

export default function Reviews({ me, project }) {
  return (
    <div className="flex flex-col gap-1 relative my-8">
      <div className="font-extrabold text-lg text-white-1 leading-none">Status Updates</div>
      <div className="text-white-2 max-w-xl">Asking the champion of the project for an update, every Friday.</div>

      <Spacer size={0.25} />
      <List project={project} />

      <Spacer size={0.25} />
      <NextUpdateSchedule project={project} />

      <WriteUpdate project={project} me={me} />
    </div>
  );
}

function List({ project }) {
  const { updates, loading, error } = useStatusUpdates({ project });

  if (loading) return <div></div>;
  if (error) return <div></div>;

  return (
    <div className="flex flex-col gap-1">
      {updates.map((update) => (
        <ListItem key={update.id} update={update} project={project} />
      ))}
    </div>
  );
}

function ListItem({ update, project }: { update: Updates.Update; project: Project.Project }) {
  const navigateToUpdate = useNavigateTo(`/projects/${project.id}/status_updates/${update.id}`);
  const author = update.author;

  return (
    <div
      className="flex flex-row justify-between items-center bg-dark-4 hover:bg-dark-5 p-2 rounded cursor-pointer"
      onClick={navigateToUpdate}
    >
      <div className="flex gap-2 items-center">
        <Avatar person={author} size="tiny" />
        <div className="font-medium text-white-1 capitalize">
          Update for <FormattedTime time={update.insertedAt} format="long-date" />
        </div>
      </div>
      <div className="flex gap-2 items-center text-sm">
        <HealthIndicator health={"on_track"} />
        <AckMarker update={update} />
      </div>
    </div>
  );
}

function AckMarker({ update }) {
  if (update.acknowledged) {
    return <Icons.IconCircleCheckFilled size={16} className="text-green-400" data-test-id="acknowledged-marker" />;
  } else {
    return <Icons.IconCircleCheckFilled size={16} className="text-white-3" />;
  }
}

function NextUpdateSchedule({ project }) {
  return (
    <div className="text-white-2">
      Next update scheduled for{" "}
      <FormattedTime time={project.nextUpdateScheduledAt} format="short-date-with-weekday-relative" />.
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
  const className = classnames("bg-shade-2 rounded-full px-2 pt-0.5 text-xs uppercase font-medium", color);

  return <div className={className}>{title}</div>;
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

function WriteUpdate({ project, me }) {
  const navigateToNewUpdate = useNavigateTo(`/projects/${project.id}/status_updates/new`);

  if (project.champion?.id !== me.id) {
    return null;
  }

  return (
    <div>
      <Button variant="secondary" onClick={navigateToNewUpdate} data-test-id="add-status-update">
        Write a status update
      </Button>
    </div>
  );
}
