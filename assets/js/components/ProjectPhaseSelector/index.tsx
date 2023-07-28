import React from "react";

import * as ProjectIcons from "@/components/ProjectIcons";

import * as SelectBox from "@/components/SilentSelectBox";

export default function ProjectPhaseSelector({ activePhase, editable, onSelected }) {
  return (
    <SelectBox.SelectBox editable={editable} onSelected={onSelected} activeValue={activePhase}>
      <SelectBox.Trigger className="flex items-center gap-1 -ml-1">
        <ProjectIcons.IconForPhase phase={activePhase} />
        <span className="capitalize font-medium text-white-1/80">{activePhase}</span>
      </SelectBox.Trigger>

      <SelectBox.Popup>
        <div className="font-bold text-sm px-2 py-1 mr-4">Change project phase</div>

        <SelectBox.Divider />

        <Option phase="paused" />

        <SelectBox.Divider />

        <Option phase="planning" />
        <Option phase="execution" />
        <Option phase="control" />

        <SelectBox.Divider />

        <Option phase="completed" />
        <Option phase="canceled" />
      </SelectBox.Popup>
    </SelectBox.SelectBox>
  );
}

function Option({ phase }) {
  return (
    <SelectBox.Option value={phase}>
      <ProjectIcons.IconForPhase phase={phase} />
      <span className="capitalize">{phase}</span>
    </SelectBox.Option>
  );
}
