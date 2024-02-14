import * as React from "react";

import { GhostButton } from "@/components/Button";
import { Options } from "./Options";
import { MilestoneIcon } from "@/components/MilestoneIcon";

export function Title({ milestone, form }) {
  if (form.title.state === "edit") {
    return <EditTitle form={form} />;
  } else {
    return <DisplayTitle milestone={milestone} form={form} />;
  }
}

function DisplayTitle({ milestone, form }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="border border-stroke-base rounded-full p-4">
        <MilestoneIcon milestone={milestone} size={40} />
      </div>

      <div className="flex gap-2 items-center mb-4">
        <div className="text-3xl font-extrabold text-content-accent text-center">{milestone.title}</div>
      </div>

      <Options form={form} />
    </div>
  );
}

function EditTitle({ form }) {
  return (
    <div className="flex flex-col gap-2 mb-4">
      <input
        className="text-2xl font-extrabold text-content-accent hover:bg-shade-1 -m-1.5 p-1.5 flex-1"
        value={form.title.title}
        onChange={(e) => form.title.setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") form.title.submit();
        }}
        autoFocus
        data-test-id="milestone-title-input"
      />

      <div className="flex items-center gap-2">
        <GhostButton size="xs" onClick={form.title.submit} data-test-id="save-milestone" type="primary">
          Save
        </GhostButton>

        <GhostButton size="xs" onClick={form.title.stopEditing} data-test-id="cancel-milestone" type="secondary">
          Cancel
        </GhostButton>
      </div>
    </div>
  );
}
