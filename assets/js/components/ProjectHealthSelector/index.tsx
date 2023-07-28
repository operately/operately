import React from "react";

import * as ProjectIcons from "@/components/ProjectIcons";
import * as SelectBox from "@/components/SilentSelectBox";

export default function ProjectHealthSelector({ editable, onSelected, active }) {
  return (
    <SelectBox.SelectBox editable={editable} onSelected={onSelected} activeValue={active}>
      <SelectBox.Trigger className="flex items-center gap-1 -ml-1">
        <ProjectIcons.IconForHealth health={active} />
        <HealthTitle health={active} />
      </SelectBox.Trigger>

      <SelectBox.Popup>
        <div className="font-bold text-sm px-2 py-1 mr-4">Change project health</div>

        <Option value="on_track" />
        <Option value="at_risk" />
        <Option value="off_track" />

        <SelectBox.Divider />

        <Option value="unknown" />
      </SelectBox.Popup>
    </SelectBox.SelectBox>
  );
}

function Option({ value }) {
  return (
    <SelectBox.Option value={value}>
      <ProjectIcons.IconForHealth health={value} />
      <HealthTitle health={value} />
    </SelectBox.Option>
  );
}

function HealthTitle({ health }) {
  switch (health) {
    case "on_track":
      return <>On-Track</>;
    case "at_risk":
      return <>At Risk</>;
    case "off_track":
      return <>Off-Track</>;
    case "unknown":
      return <span className="text-white-1/60">Unknown</span>;
    default:
      throw new Error(`Unknown health: ${health}`);
  }
}
