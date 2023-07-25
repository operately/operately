import React from "react";

import classnames from "classnames";

import * as Icons from "@tabler/icons-react";
import * as Cards from "@/components/Cards";
import * as Milestones from "@/graphql/Projects/milestones";
import FormattedTime from "@/components/FormattedTime";

export default function MilestonesCard({ project }) {
  return (
    <Cards.Card linkTo={`/projects/${project.id}/milestones`}>
      <Cards.Header>
        <div className="flex items-center gap-2">
          <Cards.Title>Milestones</Cards.Title>
        </div>
      </Cards.Header>

      <Cards.Body>
        <Content project={project} />
      </Cards.Body>
    </Cards.Card>
  );
}

function Content({ project }) {
  if (project.milestones.length === 0) {
    return <EmptyState />;
  } else {
    return <MilestonesList project={project} />;
  }
}

function EmptyState() {
  return (
    <div className="flex items-center flex-col w-full gap-4 justify-center mt-8 text-base px-8">
      <div className="bg-orange-500/80 rounded-full p-3">
        <Icons.IconFlag3Filled size={40} className="text-white-1/80" />
      </div>

      <p className="text-center font-medium">
        Define important mileastones for your project, track their progress, and align the team around them.
      </p>
    </div>
  );
}

function MilestonesList({ project }) {
  const milestones = Milestones.sortByDeadline(project.milestones);
  const [pending, done] = [
    milestones.filter((milestone) => milestone.status === "pending"),
    milestones.filter((milestone) => milestone.status === "done"),
  ];

  const showSeparator = pending.length > 0 && done.length > 0;

  return (
    <div className="flex flex-col gap-2 py-2">
      {pending.map((milestone) => (
        <Item key={milestone.id} milestone={milestone} />
      ))}

      {showSeparator && <div className="font-extrabold pt-2 text-xs">Completed</div>}

      {done.map((milestone) => (
        <Item key={milestone.id} milestone={milestone} />
      ))}
    </div>
  );
}

function Item({ milestone }) {
  return (
    <div className="flex flex-col gap-0.5 text-xs">
      <div className="font-semibold line-clamp-1">{milestone.title}</div>

      <div
        className={classnames("flex items-center gap-1", {
          "text-green-400/80": milestone.status === "done",
          "text-yellow-400/80": milestone.status === "pending",
        })}
      >
        <FormattedTime time={milestone.deadlineAt} format="long-date" />
        {milestone.status === "done" && <Icons.IconCheck size={14} />}
      </div>
    </div>
  );
}
