import * as Forms from "@/components/Form";
import * as Milestones from "@/models/milestones";
import * as React from "react";

import { DateField, PrimaryButton, SecondaryButton } from "turboui";
import { MilestoneIcon } from "@/components/MilestoneIcon";

import { FormState } from "./useForm";

interface Props {
  milestone: Milestones.Milestone;
  form: FormState;
}

export function Header({ milestone, form }: Props) {
  if (form.titleAndDeadline.state === "show") {
    return <Display milestone={milestone} form={form} />;
  } else {
    return <Edit form={form} />;
  }
}

function Display({ milestone, form }: Props) {
  return (
    <div className="flex flex-col items-center justify-center mb-4">
      <OverdueWarning form={form} />

      <div className="border border-stroke-base rounded-full p-4">
        <MilestoneIcon milestone={{ status: milestone.status, timeframe: milestone.timeframe }} size={40} />
      </div>

      <div className="text-3xl font-extrabold text-content-accent text-center mt-4">{form.titleAndDeadline.title}</div>

      <div className="flex items-center text-lg mt-2 mb-4">
        <DateField date={form.titleAndDeadline.date} readonly hideCalendarIcon size="lg" />
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

function Actions({ milestone, form }: Props) {
  if (milestone.status === "pending") {
    const isOverdue = Milestones.isOverdue(form.milestone);

    return (
      <div className="flex justify-center gap-2">
        <PrimaryButton size="sm" onClick={form.completeMilestone} testId="complete-milestone">
          Mark as Completed
        </PrimaryButton>

        {isOverdue && (
          <SecondaryButton size="sm" onClick={form.titleAndDeadline.startEditing} testId="edit-milestone">
            Reschedule
          </SecondaryButton>
        )}
      </div>
    );
  }

  if (milestone.status === "done") {
    return (
      <div className="flex justify-between">
        <SecondaryButton size="sm" onClick={form.reopenMilestone} testId="reopen-milestone">
          Re-Open Milestone
        </SecondaryButton>
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

      <DateField
        date={form.titleAndDeadline.date!}
        onDateSelect={form.titleAndDeadline.setDate}
        placeholder="Not set"
        testId="due-date"
        error={form.titleAndDeadline.errors.date}
        variant="form-field"
      />

      <div className="flex items-center gap-2 justify-end mt-2">
        <SecondaryButton size="sm" onClick={form.titleAndDeadline.cancel} data-test-id="cancel-milestone">
          Cancel
        </SecondaryButton>

        <PrimaryButton size="sm" onClick={form.titleAndDeadline.submit} testId="save-milestone">
          Save Changes
        </PrimaryButton>
      </div>
    </div>
  );
}
