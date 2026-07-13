import React from "react";

import { Person } from "@/models/people";
import { ProjectCheckIn, useEditProjectCheckIn } from "@/models/projectCheckIns";
import { useNavigate } from "react-router";

import { ScheduleFlowControls } from "@/components/ScheduleFlowControls";
import { Status, StatusOptions } from "@/components/status";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useScheduleFlow } from "@/hooks/useScheduleFlow";
import { assertPresent } from "@/utils/assertions";
import { compareIds } from "@/routes/paths";
import { isWithinTimeframe } from "@/utils/time";
import {
  FormattedTime,
  Forms,
  GhostButton,
  InfoCallout,
  Spacer,
  displayDate,
  type FormState,
} from "turboui";

import { usePaths } from "@/routes/paths";

export function Form({ checkIn }: { checkIn: ProjectCheckIn }) {
  const paths = usePaths();
  const [edit] = useEditProjectCheckIn();
  const navigate = useNavigate();

  assertPresent(checkIn.project, "project must be present in checkIn");

  const isUnpublished = checkIn.state === "draft" || checkIn.state === "scheduled";
  const canSchedule = isUnpublished;
  const scheduleFlow = useScheduleFlow({
    initialScheduledAt: canSchedule ? checkIn.scheduledAt : null,
  });

  const allowFullEdit =
    isUnpublished ||
    (checkIn.project.lastCheckIn?.id
      ? compareIds(checkIn.project.lastCheckIn.id, checkIn.id) && isWithinTimeframe(displayDate(checkIn), 72)
      : false);

  const form = Forms.useForm({
    fields: {
      status: checkIn.status,
      description: JSON.parse(checkIn.description!),
    },
    validate: (addError) => {
      if (allowFullEdit && !form.values.status) {
        addError("status", "Status is required");
      }
      if (!form.values.description) {
        addError("description", "Description is required");
      }
    },
    cancel: () => {
      navigate(paths.projectCheckInPath(checkIn.id!));
    },
    submit: async (action: "save" | "publish" | "schedule" = "save") => {
      const status = form.values.status;
      const description = form.values.description;
      if (!status || !description) return;

      const shouldSchedule = action === "schedule" || (action === "publish" && scheduleFlow.isScheduledLocally);

      const res = await edit({
        checkInId: checkIn.id,
        status,
        description: JSON.stringify(description),
        ...(isUnpublished
          ? shouldSchedule
            ? { state: "scheduled" as const, scheduledAt: scheduleFlow.scheduledAtIso }
            : action === "publish"
              ? { state: "published" as const }
              : { state: "draft" as const, scheduledAt: null }
          : {}),
      });

      navigate(paths.projectCheckInPath(res.checkIn.id));
    },
  });

  return (
    <Forms.Form form={form}>
      <Header checkIn={checkIn} />

      <FullEditDisabledMessage allowFullEdit={allowFullEdit} isUnpublished={isUnpublished} />

      <Forms.FieldGroup>
        <StatusSection
          reviewer={checkIn.project?.reviewer || undefined}
          allowFullEdit={allowFullEdit}
          checkIn={checkIn}
        />
        <DescriptionSection checkIn={checkIn} />
      </Forms.FieldGroup>

      <Spacer size={4} />

      <SubmitButtons form={form} canSchedule={canSchedule} scheduleFlow={scheduleFlow} />
    </Forms.Form>
  );
}

function FullEditDisabledMessage({
  allowFullEdit,
  isUnpublished,
}: {
  allowFullEdit: boolean;
  isUnpublished: boolean;
}) {
  if (isUnpublished || allowFullEdit) return null;

  return (
    <InfoCallout
      message="Editing locked after 3 days"
      description="You can edit the status for up to 3 days after submitting your check-in. After that, it's locked in to keep the history clear and decisions accountable. Need to make a change? Leave a comment or create a new check-in."
    />
  );
}

function SubmitButtons({
  form,
  canSchedule,
  scheduleFlow,
}: {
  form: FormState<{ status: ProjectCheckIn["status"]; description: any }>;
  canSchedule: boolean;
  scheduleFlow: ReturnType<typeof useScheduleFlow>;
}) {
  const submit = (action: "save" | "publish" | "schedule") => {
    form.actions.setTrigger(action);
    form.actions.submit(action);
  };

  const isSubmitting = form.state === "submitting";

  if (!canSchedule) {
    return <Forms.Submit saveText="Submit" buttonSize="base" />;
  }

  return (
    <div className="mt-8">
      <ScheduleFlowControls
        scheduleFlow={scheduleFlow}
        primaryLabel="Submit check-in"
        onPrimaryClick={() => submit(scheduleFlow.isScheduledLocally ? "schedule" : "publish")}
        loading={isSubmitting && (form.trigger === "publish" || form.trigger === "schedule")}
        testId="publish-draft"
        secondaryAction={
          <GhostButton
            loading={isSubmitting && form.trigger === "save"}
            testId="save-draft"
            size="base"
            onClick={() => submit("save")}
          >
            Save draft
          </GhostButton>
        }
      />
    </div>
  );
}

function Header({ checkIn }: { checkIn: ProjectCheckIn }) {
  const formattedTimePreferences = useFormattedTimePreferences();

  return (
    <div>
      <div className="text-2xl font-bold mx-auto">
        Editing the Check-In from{" "}
        <FormattedTime {...formattedTimePreferences} time={displayDate(checkIn)} format="long-date" />
      </div>
    </div>
  );
}

function StatusSection({
  reviewer,
  allowFullEdit,
  checkIn,
}: {
  reviewer?: Person;
  allowFullEdit: boolean;
  checkIn: ProjectCheckIn;
}) {
  if (allowFullEdit) {
    return (
      <div className="mt-8 mb-4">
        <Forms.SelectStatus
          label="1. How's the project going?"
          field="status"
          reviewer={reviewer}
          options={["on_track", "caution", "off_track"]}
        />
      </div>
    );
  }

  return (
    <div className="mt-8 mb-4">
      <div className="font-bold">1. How's the project going?</div>
      <div className="mt-2 flex flex-col gap-2 rounded-lg border border-stroke-base p-2">
        <Status status={checkIn.status as StatusOptions} reviewer={reviewer} />
      </div>
    </div>
  );
}

function DescriptionSection({ checkIn }: { checkIn: ProjectCheckIn }) {
  assertPresent(checkIn.project, "project must be present in checkIn");

  const richTextHandlers = useRichEditorHandlers({ scope: { type: "project", id: checkIn.project.id! } });

  return (
    <Forms.RichTextArea
      label="2. What's new since the last check-in?"
      field="description"
      richTextHandlers={richTextHandlers}
      placeholder="Write your check-in here..."
    />
  );
}
