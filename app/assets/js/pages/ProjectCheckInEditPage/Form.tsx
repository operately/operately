import React from "react";

import { Person } from "@/models/people";
import { ProjectCheckIn, useEditProjectCheckIn } from "@/models/projectCheckIns";
import { useNavigate } from "react-router-dom";

import FormattedTime from "@/components/FormattedTime";
import Forms from "@/components/Forms";
import { Spacer } from "@/components/Spacer";
import { assertPresent } from "@/utils/assertions";

export function Form({ checkIn }: { checkIn: ProjectCheckIn }) {
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
      navigate(DeprecatedPaths.projectCheckInPath(checkIn.id!));
    },
    submit: async () => {
      const res = await edit({
        checkInId: checkIn.id,
        status: form.values.status,
        description: JSON.stringify(form.values.description),
      });

      navigate(DeprecatedPaths.projectCheckInPath(res.checkIn.id));
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

      <Forms.Submit saveText="Submit" buttonSize="base" />
    </Forms.Form>
  );
}

function Header({ checkIn }: { checkIn: ProjectCheckIn }) {
  return (
    <div>
      <div className="text-2xl font-bold mx-auto">
        Editing the Check-In from <FormattedTime time={checkIn.insertedAt!} format="long-date" />
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
        options={["on_track", "caution", "issue"]}
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
