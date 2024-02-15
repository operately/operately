import * as React from "react";
import * as Forms from "@/components/Form";

import { FilledButton } from "@/components/Button";
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
      <Forms.TextInput
        label="Milestone Name"
        id="milestone-title-input"
        value={form.title.title}
        onChange={form.title.setTitle}
        onOnKeyDown={form.title.submit}
        data-test-id="milestone-title-input"
        autoFocus
        error={form.title.error}
      />

      <div className="flex items-center gap-2 justify-end">
        <FilledButton size="xs" onClick={form.title.stopEditing} data-test-id="cancel-milestone" type="secondary">
          Cancel
        </FilledButton>

        <FilledButton
          size="xs"
          onClick={form.title.submit}
          data-test-id="save-milestone"
          type="primary"
          bzzzOnClickFailure
        >
          Save
        </FilledButton>
      </div>
    </div>
  );
}
