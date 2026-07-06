import React from "react";

import { Person } from "@/models/people";
import { ProjectCheckIn, useEditProjectCheckIn } from "@/models/projectCheckIns";
import { useNavigate } from "react-router-dom";

import Forms, { FormState } from "@/components/Forms";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { assertPresent } from "@/utils/assertions";
import { displayDate } from "@/utils/drafts";
import { FormattedTime, GhostButton, PrimaryButton, Spacer } from "turboui";

import { usePaths } from "@/routes/paths";
export function Form({ checkIn }: { checkIn: ProjectCheckIn }) {
  const paths = usePaths();
  const [edit] = useEditProjectCheckIn();
  const navigate = useNavigate();

  const form = Forms.useForm({
    fields: {
      status: checkIn.status,
      description: JSON.parse(checkIn.description!),
    },
    validate: (addError) => {
      if (!form.values.status) {
        addError("status", "Status is required");
      }
      if (!form.values.description) {
        addError("description", "Description is required");
      }
    },
    cancel: () => {
      navigate(paths.projectCheckInPath(checkIn.id!));
    },
    submit: async (action: "save" | "publish" = "save") => {
      const status = form.values.status;
      const description = form.values.description;
      if (!status || !description) return;

      const res = await edit({
        checkInId: checkIn.id,
        status,
        description: JSON.stringify(description),
        state: checkIn.state === "draft" ? (action === "publish" ? "published" : "draft") : undefined,
      });

      navigate(paths.projectCheckInPath(res.checkIn.id));
    },
  });

  return (
    <Forms.Form form={form}>
      <Header checkIn={checkIn} />

      <Forms.FieldGroup>
        <StatusSection reviewer={checkIn.project?.reviewer || undefined} />
        <DescriptionSection checkIn={checkIn} />
      </Forms.FieldGroup>

      <Spacer size={4} />

      <SubmitButtons form={form} isDraft={checkIn.state === "draft"} />
    </Forms.Form>
  );
}

function SubmitButtons({
  form,
  isDraft,
}: {
  form: FormState<{ status: ProjectCheckIn["status"]; description: any }>;
  isDraft: boolean;
}) {
  const submit = (action: "save" | "publish") => {
    form.actions.setTrigger(action);
    form.actions.submit(action);
  };

  const isSubmitting = form.state === "submitting";

  if (!isDraft) {
    return <Forms.Submit saveText="Submit" buttonSize="base" />;
  }

  return (
    <div className="mt-8 flex items-center gap-2">
      <PrimaryButton
        loading={isSubmitting && form.trigger === "save"}
        testId="save-draft"
        size="base"
        onClick={() => submit("save")}
      >
        Save draft
      </PrimaryButton>

      <GhostButton
        loading={isSubmitting && form.trigger === "publish"}
        testId="publish-draft"
        size="base"
        onClick={() => submit("publish")}
      >
        Submit check-in
      </GhostButton>
    </div>
  );
}

function Header({ checkIn }: { checkIn: ProjectCheckIn }) {
  const formattedTimePreferences = useFormattedTimePreferences();

  return (
    <div>
      <div className="text-2xl font-bold mx-auto">
        Editing the Check-In from <FormattedTime {...formattedTimePreferences} time={displayDate(checkIn)} format="long-date" />
      </div>
    </div>
  );
}

function StatusSection({ reviewer }: { reviewer?: Person }) {
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

function DescriptionSection({ checkIn }: { checkIn: ProjectCheckIn }) {
  assertPresent(checkIn.project, "project must be present in checkIn");

  const mentionSearchScope = { type: "project", id: checkIn.project.id! } as const;

  return (
    <Forms.RichTextArea
      label="2. What's new since the last check-in?"
      field="description"
      mentionSearchScope={mentionSearchScope}
      placeholder="Write your check-in here..."
    />
  );
}
