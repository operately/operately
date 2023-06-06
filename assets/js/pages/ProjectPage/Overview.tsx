import React from "react";

import RichContent from "@//components/RichContent";

import KeyResources from "./KeyResources";
import GoalsAndKpis from "./GoalsAndKpis";
import Milestones from "./Milestones";

function Description({ project }) {
  return (
    <div>
      <div className="text-lg">
        <RichContent jsonContent={project.description} />
      </div>
    </div>
  );
}

export default function Overview({ project }) {
  return (
    <div>
      <div className="border-b border-shade-2 py-4 -mx-8 px-8 mt-4 pb-10">
        <Description project={project} />
      </div>

      <GoalsAndKpis />
      <Milestones project={project} />
      <KeyResources />
    </div>
  );
}
