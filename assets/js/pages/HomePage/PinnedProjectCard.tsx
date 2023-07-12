import React from "react";

import { Card, CardSectionTitle } from "./Card";
import * as Icons from "@tabler/icons-react";
import Avatar from "@/components/Avatar";
import { Project } from "@/graphql/Projects";

export function PinnedProjectCard({ panel }) {
  const project = panel.linkedResource as Project;

  const pendingMilestones = project.milestones.filter((m) => m.status === "pending");
  const nextMilestone = pendingMilestones.length > 0 ? pendingMilestones[0] : null;

  return (
    <Card linkTo={`/projects/${project.id}`}>
      <div className="h-full flex flex-col justify-between gap-4">
        <h1 className="font-bold flex items-center gap-2">
          <Icons.IconTableFilled size={20} /> {project.name}
        </h1>

        <div className="flex-1 flex flex-col gap-4">
          <div>
            <CardSectionTitle title="Phase" />
            <div className="font-bold capitalize">{project.phase}</div>
          </div>

          <div>
            <CardSectionTitle title="Next Milestone" />
            {nextMilestone ? (
              <div className="font-bold capitalize">{nextMilestone.title}</div>
            ) : (
              <div className="text-white-2">No milestones</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {project.contributors.map((c) => (
            <div key={c.person.id} className="mt-4">
              <Avatar size="tiny" person={c.person} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
