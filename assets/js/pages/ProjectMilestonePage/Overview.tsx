import * as React from "react";
import * as Milestones from "@/graphql/Projects/milestones";
import * as Icons from "@tabler/icons-react";

import { FilledButton } from "@/components/Button";
import { DateSelector } from "./Dateselector";

export function Overview({ milestone, form }) {
  return (
    <div className="flex flex-col gap-4 justify-center items-center">
      <div className="flex items-center gap-12">
        <DueDate form={form} />
      </div>

      {milestone.status === "pending" && (
        <FilledButton size="sm" onClick={form.completeMilestone} data-test-id="complete-milestone" type="primary">
          Mark as Completed
        </FilledButton>
      )}

      {milestone.status === "done" && (
        <FilledButton size="sm" onClick={form.reopenMilestone} data-test-id="reopen-milestone" type="secondary">
          Re-Open Milestone
        </FilledButton>
      )}
    </div>
  );
}

function DueDate({ form }) {
  return (
    <div className="flex flex-col gap-1 text-lg">
      <div className="flex items-center gap-1">
        <DateSelector
          date={form.deadline.date}
          onChange={form.deadline.setDate}
          minDate={null}
          maxDate={null}
          placeholder="Not set"
          testID="due-date"
        />
      </div>
    </div>
  );
}
