import React from "react";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as Milestones from "@/graphql/Projects/milestones";
import * as Pages from "@/components/Pages";

import { GhostButton } from "@/components/Button";
import FormattedTime from "@/components/FormattedTime";

import { useLoadedData } from "./loader";
import { createPath } from "@/utils/paths";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { Link } from "@/components/Link";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Milestones", project.name]}>
      <Paper.Root size="small">
        <ProjectPageNavigation project={project} />

        <Paper.Body>
          <Title project={project} />
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
      <div className="text-2xl font-extrabold ">Milestones</div>

      {project.permissions.canEditMilestone && (
        <div>
          <GhostButton linkTo={editTimeline} data-test-id="add-milestone">
            Add Milestones
          </GhostButton>
        </div>
      )}
    </div>
  );
}

function MilestoneList({ project }) {
  const milestones = Milestones.sortByDeadline(project.milestones);

  const [pending, completed] = [
    milestones.filter((m) => m.status === "pending"),
    milestones.filter((m) => m.status === "done"),
  ];

  const showCompletedSeperator = pending.length > 0 && completed.length > 0;

  return (
    <div className="flex flex-col mb-8 gap-2 mt-4">
      {<h2 className="font-bold">Upcoming</h2>}

      <div>
        {pending.map((m) => (
          <Item key={m.id} project={project} milestone={m} />
        ))}
      </div>

      {showCompletedSeperator && <h2 className="font-bold mt-12">Completed</h2>}

      <div>
        {completed.map((m) => (
          <Item key={m.id} project={project} milestone={m} />
        ))}
      </div>
    </div>
  );
}

function Item({ project, milestone }) {
  const path = createPath("projects", project.id, "milestones", milestone.id);

  return (
    <div className="flex flex-col border-b border-stroke-base first:border-t first:border-stroke-base py-1">
      <div className="flex items-center gap-2">
        <div className="shrink-0 mt-1">
          <Icons.IconFlag3Filled size={16} className="text-yellow-500" />
        </div>

        <div className="flex-1 font-bold">
          <Link to={path}>{milestone.title}</Link>
        </div>
      </div>

      <div className="shrink-0 text-sm ml-6">
        Due Date: <FormattedTime time={milestone.deadlineAt} format="long-date" />
      </div>
    </div>
  );
}
