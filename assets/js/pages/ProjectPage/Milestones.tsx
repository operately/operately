import React from "react";
import * as Icons from "tabler-icons-react";
import FormattedTime from "@//components/FormattedTime";

const BaseBadgeClass = "text-xs uppercase px-1.5 py-0.5 rounded ";

function Badge({ title, className = "" }) {
  return <div className={BaseBadgeClass + className}>{title}</div>;
}

function DoneBadge() {
  return (
    <Badge
      title="Completed"
      className="bg-green-400/10 text-green-400 font-bold -mb-1"
    />
  );
}

function Milestone({ milestone }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-shade-1 rounded-lg">
      <div className="flex items-center gap-2">
        <Icons.Pennant size={20} className="text-green-400" />
        <span>{milestone.title}</span>
        <span>{milestone.status === "done" && <DoneBadge />}</span>
      </div>

      <div className="text-sm flex items-center gap-3">
        <FormattedTime time={milestone.deadlineAt} format="short-date" />

        <div className="hover:text-white-1 text-white-2 cursor-pointer">
          <Icons.DotsVertical size={20} />
        </div>
      </div>
    </div>
  );
}

function AddMilestone() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border border-shade-3 rounded-lg border-dashed">
      <Icons.Plus size={20} /> Add Milestone
    </div>
  );
}

export default function Milestones({ project }) {
  return (
    <div>
      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-2 uppercase font-bold tracking-wide">
          Milestones
        </div>
      </div>

      <div className="border-b border-shade-2 py-4 -mx-8 px-8 pb-10">
        <div className="flex flex-col gap-2">
          {project.milestones.map((milestone) => (
            <Milestone milestone={milestone} key={milestone.id} />
          ))}
          <AddMilestone />
        </div>
      </div>
    </div>
  );
}
