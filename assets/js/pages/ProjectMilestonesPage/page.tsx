import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Milestones from "@/graphql/Projects/milestones";
import * as Pages from "@/components/Pages";
import * as Time from "@/utils/time";

import { GhostButton } from "@/components/Button";
import FormattedTime from "@/components/FormattedTime";

import { useLoadedData } from "./loader";
import { createPath } from "@/utils/paths";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { Link } from "@/components/Link";
import { MilestoneIcon } from "@/components/MilestoneIcon";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Timeline", project.name]}>
      <Paper.Root size="small">
        <ProjectPageNavigation project={project} />

        <Paper.Body>
          <Title project={project} />
          <Dates project={project} />
          <MilestoneList project={project} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title({ project }) {
  const editTimeline = createPath("projects", project.id, "edit", "timeline");

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="text-2xl font-extrabold leading-none">Project Timeline</div>

      {project.permissions.canEditMilestone && (
        <div>
          <GhostButton linkTo={editTimeline} testId="edit-timeline" size="sm">
            Edit Timeline
          </GhostButton>
        </div>
      )}
    </div>
  );
}

function Dates({ project }) {
  const start = Time.parse(project.startedAt);
  const end = Time.parse(project.deadline);

  return (
    <div className="flex items-center gap-12 mb-8">
      <div className="flex flex-col">
        <div className="text-sm font-bold">Start Date</div>
        <div className="text-content-accent">
          <FormattedTime time={start} format="long-date" />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="text-sm font-bold">Due Date</div>
        {end ? (
          <div className="text-content-accent">
            <FormattedTime time={end} format="long-date" />
          </div>
        ) : (
          <div className="text-content-dimmed">No due date</div>
        )}
      </div>
    </div>
  );
}

function MilestoneList({ project }) {
  let { pending, done } = Milestones.splitByStatus(project.milestones);

  pending = Milestones.sortByDeadline(pending);
  done = Milestones.sortByDoneAt(done);

  const showCompletedSeperator = pending.length > 0 && done.length > 0;

  if (pending.length === 0 && done.length === 0) {
    return (
      <div className="flex flex-col mb-8 gap-1 mt-4">
        <h2 className="font-bold">Upcoming Milestones</h2>
        <div className="">No milestones defined yet.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col mb-8 gap-2 mt-4">
      {<h2 className="font-bold">Upcoming Milestones</h2>}

      <div>
        {pending.map((m) => (
          <PendingItem key={m.id} project={project} milestone={m} />
        ))}
      </div>

      {showCompletedSeperator && <h2 className="font-bold mt-12">Completed Milestones</h2>}

      <div>
        {done.map((m) => (
          <DoneItem key={m.id} project={project} milestone={m} />
        ))}
      </div>
    </div>
  );
}

function PendingItem({ project, milestone }) {
  const path = createPath("projects", project.id, "milestones", milestone.id);

  return (
    <div className="flex flex-col border-b border-stroke-base first:border-t first:border-stroke-base py-1">
      <div className="flex items-center gap-2">
        <div className="shrink-0 mt-1">
          <MilestoneIcon milestone={milestone} />
        </div>

        <div className="flex-1 font-bold">
          <Link to={path}>{milestone.title}</Link>
        </div>
      </div>

      <div className="shrink-0 text-sm ml-6">
        Due Date: <FormattedTime time={milestone.deadlineAt} format="long-date" />
        {milestone.completedAt && (
          <>
            {" "}
            &middot; Completed on <FormattedTime time={milestone.completedAt} format="long-date" />
          </>
        )}
      </div>
    </div>
  );
}

function DoneItem({ project, milestone }) {
  const path = createPath("projects", project.id, "milestones", milestone.id);

  return (
    <div className="flex flex-col border-b border-stroke-base first:border-t first:border-stroke-base py-1">
      <div className="flex items-center gap-2">
        <div className="shrink-0 mt-1">
          <MilestoneIcon milestone={milestone} />
        </div>

        <div className="flex-1 font-bold">
          <Link to={path}>{milestone.title}</Link>
        </div>
      </div>

      <div className="shrink-0 text-sm ml-6">
        Due Date: <FormattedTime time={milestone.deadlineAt} format="long-date" />
        {milestone.completedAt && (
          <>
            {" "}
            &middot; Completed on <FormattedTime time={milestone.completedAt} format="long-date" />
          </>
        )}
      </div>
    </div>
  );
}
