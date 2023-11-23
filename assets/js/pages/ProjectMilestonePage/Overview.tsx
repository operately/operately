import * as React from "react";
import * as Milestones from "@/graphql/Projects/milestones";
import * as Icons from "@tabler/icons-react";

import { GhostButton } from "@/components/Button";
import { DateSelector } from "./Dateselector";

export function Overview({ milestone, form }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-12">
        <Status milestone={milestone} />
        <DueDate form={form} />
      </div>

      {milestone.status === "pending" && (
        <GhostButton size="xs" onClick={form.completeMilestone} data-test-id="complete-milestone">
          Complete Milestone
        </GhostButton>
      )}

      {milestone.status === "done" && (
        <GhostButton size="xs" onClick={form.reopenMilestone} data-test-id="reopen-milestone" type="secondary">
          Re-Open Milestone
        </GhostButton>
      )}
    </div>
  );
}

function Status({ milestone }) {
  let title = "";
  let color = "";

  if (Milestones.isOverdue(milestone)) {
    title = "Overdue";
    color = "text-red-500";
  }
  if (Milestones.isUpcoming(milestone)) {
    title = "Upcoming";
    color = "text-yellow-500";
  }
  if (Milestones.isDone(milestone)) {
    title = "Completed";
    color = "text-green-500";
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="uppercase text-xs font-semibold text-content-dimmed">Status</div>
      <div className="flex items-center gap-1">
        <Icons.IconCircleFilled size={16} className={color} />
        <div className="font-medium text-content-accent leading-none">{title}</div>
      </div>
    </div>
  );
}

function DueDate({ form }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="uppercase text-xs font-semibold text-content-dimmed">Due Date</div>
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
