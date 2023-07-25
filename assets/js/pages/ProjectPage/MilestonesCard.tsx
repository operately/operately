import React from "react";

import * as Icons from "@tabler/icons-react";
import * as Cards from "@/components/Cards";
// import * as Milestones from "@/graphql/Projects/milestones";
// import FormattedTime from "@/components/FormattedTime";

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
  return null;
  // return (
  //   <div className="flex flex-col gap-2">
  //     {project.milestones.map((milestone) => (
  //       <Item key={milestone.id} milestone={milestone} />
  //     ))}
  //   </div>
  // );
}

function Item({ milestone }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-col gap-1">
        <div className="font-semibold">{milestone.name}</div>
        <div className="text-xs text-gray-500">{milestone.description}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs text-gray-500">{milestone.tasks.length} tasks</div>
        <Icons.IconChevronRight size={16} />
      </div>
    </div>
  );
}
