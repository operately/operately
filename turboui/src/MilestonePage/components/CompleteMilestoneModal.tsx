import React from "react";

import { PrimaryButton, SecondaryButton } from "../../Button";
import * as Forms from "../../Forms";
import { Modal } from "../../Modal";
import { StatusSelector } from "../../StatusSelector";
import type * as Types from "../../TaskBoard/types";
import type { MilestonePage } from "../types";

export interface CompleteMilestoneModalProps {
  isOpen: boolean;
  milestoneName: string;
  openTaskCount: number;
  closedStatuses: Types.Status[];
  onClose: () => void;
  onComplete: (resolution: MilestonePage.OpenTasksResolution) => Promise<boolean>;
}

interface FormValues extends Forms.FormValues {
  resolutionAction: MilestonePage.OpenTasksResolution["action"];
  statusId: string;
}

export function CompleteMilestoneModal(props: CompleteMilestoneModalProps) {
  const defaultStatus = preferredClosedStatus(props.closedStatuses);
  const form = Forms.useForm<FormValues>({
    fields: {
      resolutionAction: "move_to_no_milestone",
      statusId: defaultStatus?.id ?? "",
    },
    submit: async () => {
      const resolution = buildResolution(form.values, props.closedStatuses);

      if (!resolution) {
        form.actions.addErrors({ form: "Select a closed task status." });
        return;
      }

      const completed = await props.onComplete(resolution);
      if (!completed) {
        form.actions.addErrors({ form: "The milestone could not be completed. Check the tasks and try again." });
        return;
      }

      form.actions.reset();
      props.onClose();
    },
    cancel: props.onClose,
  });

  React.useEffect(() => {
    if (!props.isOpen) return;

    form.actions.reset();
    form.actions.setValue("statusId", preferredClosedStatus(props.closedStatuses)?.id ?? "");
  }, [props.isOpen, props.closedStatuses]);

  const selectedStatus =
    props.closedStatuses.find((status) => status.id === form.values.statusId) ?? defaultStatus ?? null;
  const changesStatus = form.values.resolutionAction === "set_status";
  const taskLabel = `${props.openTaskCount} open task${props.openTaskCount === 1 ? "" : "s"}`;

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={() => void form.actions.cancel()}
      title={`Complete “${props.milestoneName}”?`}
      size="small"
      testId="complete-milestone-modal"
    >
      <Forms.Form form={form} className="space-y-5" testId="complete-milestone-form">
        <p className="text-sm text-content-base">
          This milestone has {taskLabel}. Choose what happens to them before completing it.
        </p>

        <Forms.RadioButtons
          field="resolutionAction"
          label="Open tasks"
          options={[
            { value: "move_to_no_milestone", label: "Move tasks to No milestone" },
            { value: "set_status", label: "Change tasks to a closed status" },
          ]}
        />

        <p className="text-xs text-content-dimmed">
          {changesStatus
            ? "The tasks stay in this milestone and use the selected status."
            : "The tasks stay open and remain visible on the project task board."}
        </p>

        {changesStatus && selectedStatus && (
          <div className="space-y-1.5">
            <div className="text-sm font-medium text-content-base">Task status</div>
            <StatusSelector
              statusOptions={props.closedStatuses}
              status={selectedStatus}
              onChange={(status) => form.actions.setValue("statusId", status.id)}
              variant="form-field"
              testId="complete-milestone-task-status"
            />
          </div>
        )}

        <Forms.FormError className="mt-2" />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <SecondaryButton type="button" onClick={() => void form.actions.cancel()} disabled={form.state !== "idle"}>
            Keep milestone active
          </SecondaryButton>
          <PrimaryButton type="submit" loading={form.state === "submitting"} disabled={form.state !== "idle"}>
            Complete milestone
          </PrimaryButton>
        </div>
      </Forms.Form>
    </Modal>
  );
}

function preferredClosedStatus(statuses: Types.Status[]) {
  return statuses.find((status) => status.color === "green") ?? statuses[0] ?? null;
}

function buildResolution(values: FormValues, statuses: Types.Status[]): MilestonePage.OpenTasksResolution | null {
  if (values.resolutionAction === "move_to_no_milestone") {
    return { action: "move_to_no_milestone" };
  }

  const status = statuses.find((candidate) => candidate.id === values.statusId);
  return status ? { action: "set_status", status } : null;
}
