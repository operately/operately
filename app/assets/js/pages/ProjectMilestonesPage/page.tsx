import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Milestones from "@/models/milestones";
import { Project } from "@/models/projects";
import { parseContextualDate } from "@/models/contextualDates";

import FormattedTime from "@/components/FormattedTime";
import { GhostButton, DateField, Link } from "turboui";

import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { MilestoneIcon } from "@/components/MilestoneIcon";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { useLoadedData } from "./loader";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Timeline", project.name!]} testId="project-timeline-page">
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
  const paths = usePaths();
  const editTimeline = paths.projectEditTimelinePath(project.id);

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

function Dates({ project }: { project: Project }) {
  assertPresent(project.timeframe);

  return (
    <div className="flex items-center gap-12 mb-8">
      <div className="flex flex-col">
        <div className="font-bold">Start Date</div>
        <DateField
          date={parseContextualDate(project.timeframe.contextualStartDate)}
          placeholder="No start date"
          readonly
          hideCalendarIcon
          size="lg"
        />
      </div>

      <div className="flex flex-col">
        <div className="font-bold">Due Date</div>
        <DateField
          date={parseContextualDate(project.timeframe.contextualEndDate)}
          placeholder="No due date"
          readonly
          hideCalendarIcon
          size="lg"
        />
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
          <PendingItem key={m.id} milestone={m} />
        ))}
      </div>

      {showCompletedSeperator && <h2 className="font-bold mt-12">Completed Milestones</h2>}

      <div>
        {done.map((m) => (
          <DoneItem key={m.id} milestone={m} />
        ))}
      </div>
    </div>
  );
}

function PendingItem({ milestone }) {
  const paths = usePaths();
  const path = paths.projectMilestonePath(milestone.id);

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

function DoneItem({ milestone }) {
  const paths = usePaths();
  const path = paths.projectMilestonePath(milestone.id);

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
