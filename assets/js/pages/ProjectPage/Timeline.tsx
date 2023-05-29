import React from "react";

import AbsoluteTime from "../../components/AbsoluteTime";

function Milestone({ milestone }) {
  return (
    <div className="border-t border-gray-700 flex items-center justify-between">
      <div className="mt-4 flex gap-2 items-center mb-4">
        {milestone.status === "done" ? (
          <div className="border-2 border-brand-base h-7 w-7 rounded-full flex items-center justify-center cursor-pointer">
            <Icon name="checkmark" color="brand" size="small" />{" "}
          </div>
        ) : (
          <div className="border-2 border-gray-700 h-7 w-7 rounded-full flex items-center justify-center hover:border-brand-base cursor-pointer"></div>
        )}
        {milestone.title}
      </div>

      <div className="text-right">
        <AbsoluteTime date={milestone.deadlineAt} />
      </div>
    </div>
  );
}

function Milestones({ milestones }) {
  let sortedMilestones = [].concat(milestones).sort((m1, m2) => {
    let d1 = +new Date(m1.deadlineAt);
    let d2 = +new Date(m2.deadlineAt);

    return d1 - d2;
  });

  return (
    <div className="mt-16">
      <h1 className="uppercase font-bold mb-4">Milestones</h1>

      {sortedMilestones.map((milestone) => (
        <Milestone key={milestone.id} milestone={milestone} />
      ))}
    </div>
  );
}

export default function Timeline({ data }) {
  return <Milestones milestones={data.project.milestones} />;
}
