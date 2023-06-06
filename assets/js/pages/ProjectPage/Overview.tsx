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
    <div className="fadeIn">
      <div className="border-b border-shade-2 -mx-8 px-8 mt-4 py-8 fadeIn">
        <Description project={project} />
      </div>

      <GoalsAndKpis />
      <Milestones project={project} />
      <KeyResources />
    </div>
  );
}
