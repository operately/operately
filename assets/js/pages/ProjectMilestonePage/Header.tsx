import * as React from "react";
import * as Forms from "@/components/Form";
import * as Milestones from "@/models/milestones";

import { FilledButton } from "@/components/Button";
import { MilestoneIcon } from "@/components/MilestoneIcon";

import FormattedTime from "@/components/FormattedTime";
import { FormState } from "./useForm";

export function Header({ milestone, form }: { milestone: any; form: FormState }) {
  if (form.titleAndDeadline.state === "show") {
    return <Display milestone={milestone} form={form} />;
  } else {
    return <Edit form={form} />;
  }
}

function Display({ milestone, form }) {
  return (
    <div className="flex flex-col items-center justify-center mb-4">
      <OverdueWarning form={form} />

      <div className="border border-stroke-base rounded-full p-4">
        <MilestoneIcon milestone={{ status: milestone.status, deadlineAt: form.titleAndDeadline.date }} size={40} />
      </div>

      <div className="text-3xl font-extrabold text-content-accent text-center mt-4">{form.titleAndDeadline.title}</div>

      <div className="flex items-center text-lg mt-2 mb-4">
        <FormattedTime time={form.titleAndDeadline.date} format="short-date-with-weekday" />
      </div>

      <Actions milestone={milestone} form={form} />
    </div>
  );
}

function OverdueWarning({ form }: { form: FormState }) {
  const isOverdue = Milestones.isOverdue(form.milestone);

  if (isOverdue) {
    const days = Milestones.daysOverdue(form.milestone);
    return (
      <div className="text-sm text-red-600 font-semibold bg-red-100 p-1 px-4 mb-4">
        Overdue by {days} {days === 1 ? "day" : "days"}
      </div>
    );
  }

  return null;
}

function Actions({ milestone, form }) {
  if (milestone.status === "pending") {
    const isOverdue = Milestones.isOverdue(form.milestone);

    return (
      <div className="flex justify-center gap-2">
        <FilledButton size="sm" onClick={form.completeMilestone} data-test-id="complete-milestone" type="primary">
          Mark as Completed
        </FilledButton>

        {isOverdue && (
          <FilledButton
            size="sm"
            onClick={form.titleAndDeadline.startEditing}
            data-test-id="edit-milestone"
            type="secondary"
          >
            Reschedule
          </FilledButton>
        )}
      </div>
    );
  }

  if (milestone.status === "done") {
    return (
      <div className="flex justify-between">
        <FilledButton size="sm" onClick={form.reopenMilestone} data-test-id="reopen-milestone" type="secondary">
          Re-Open Milestone
        </FilledButton>
      </div>
    );
  }

  throw new Error("Unknown milestone status: " + milestone.status);
}

function Edit({ form }: { form: FormState }) {
  return (
    <div className="flex flex-col gap-4 my-4">
      <Forms.TextInput
        label="Milestone Name"
        id="milestone-title-input"
        value={form.titleAndDeadline.title}
        onChange={form.titleAndDeadline.setTitle}
        data-test-id="milestone-title-input"
        autoFocus
        error={form.titleAndDeadline.errors.title}
      />

      <Forms.DateSelector
        label="Due Date"
        date={form.titleAndDeadline.date!}
        onChange={form.titleAndDeadline.setDate}
        minDate={null}
        maxDate={null}
        placeholder="Not set"
        testID="due-date"
        error={form.titleAndDeadline.errors.date}
      />

      <div className="flex items-center gap-2 justify-end mt-2">
        <FilledButton size="sm" onClick={form.titleAndDeadline.cancel} data-test-id="cancel-milestone" type="secondary">
          Cancel
        </FilledButton>

        <FilledButton
          size="sm"
          onClick={form.titleAndDeadline.submit}
          testId="save-milestone"
          type="primary"
          bzzzOnClickFailure
        >
          Save Changes
        </FilledButton>
      </div>
    </div>
  );
}
