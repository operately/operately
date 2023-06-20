import React from "react";

import { useParams } from "react-router-dom";
import { useProject } from "@/graphql/Projects";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as Milestones from "@/graphql/Projects/milestones";

import FormattedTime from "@/components/FormattedTime";

export function ProjectMilestonesPage() {
  const params = useParams();
  const projectId = params["project_id"];

  if (!projectId) return <p className="mt-16">Unable to find project</p>;

  const { loading, error, data } = useProject(projectId);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find project</p>;

  const project = data.project;

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${projectId}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <Title />

        <MilestoneList project={project} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Title() {
  return (
    <div className="p-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold ">Milestones</div>
          <div className="text-medium">
            Set milestones for your project and track progress
          </div>
        </div>
      </div>
    </div>
  );
}

function MilestoneList({ project }) {
  const milestones: Milestones.Milestone[] = Milestones.sortByDeadline(
    project.milestones
  );

  return (
    <div className="flex flex-col px-8 divide-y divide-shade-1">
      <div className="flex items-center justify-between py-3 text-pink-400">
        <div className="flex items-center gap-2">
          <div className="w-32 pr-4">DUE DATE</div>
          MILESTONE
        </div>
      </div>
      {milestones.map((m) => (
        <MilestoneItem key={m.id} milestone={m} />
      ))}
    </div>
  );
}

function MilestoneItem({ milestone }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-2">
        <div className="w-32 pr-4">
          <FormattedTime time={milestone.deadlineAt} format="short-date" />
        </div>
        {milestone.title}
      </div>

      <div className="flex items-center gap-2">
        <MilestoneIcon milestone={milestone} />
      </div>
    </div>
  );
}

function MilestoneIcon({ milestone }) {
  switch (milestone.status) {
    case "pending":
      return <Icons.IconCircle size={32} className="text-shade-3" />;
    case "done":
      return <Icons.IconCircleCheck size={32} className="text-green-400" />;
    default:
      throw new Error("unknown milestone status " + milestone.status);
  }
}
