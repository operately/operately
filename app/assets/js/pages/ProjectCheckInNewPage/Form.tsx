import React from "react";

import { Person } from "@/models/people";
import { parseCheckInsForTurboUi, usePostProjectCheckIn, ProjectCheckInStatus } from "@/models/projectCheckIns";
import { Project } from "@/models/projects";
import { useNavigate } from "react-router-dom";

import Forms from "@/components/Forms";
import { Spacer } from "@/components/Spacer";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { LastCheckIn, SubscribersSelector } from "turboui";
import { assertPresent } from "@/utils/assertions";

import { usePaths } from "@/routes/paths";

export function Form({ project }: { project: Project }) {
  const paths = usePaths();
  const { mentionedPersonLookup } = useRichEditorHandlers();
  assertPresent(project.potentialSubscribers, "potentialSubscribers must be present in project");

  const [post] = usePostProjectCheckIn();
  const navigate = useNavigate();
  const lastCheckIns = project.lastCheckIn ? parseCheckInsForTurboUi(paths, [project.lastCheckIn]) : [];

  const subscriptionsState = useSubscriptionsAdapter(project.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
    projectName: project.name,
  });

  const form = Forms.useForm<{
    status: ProjectCheckInStatus | null;
    description: any;
  }>({
    fields: {
      status: null,
      description: null,
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
      navigate(paths.projectCheckInsPath(project.id!));
    },
    submit: async () => {
      const res = await post({
        projectId: project.id,
        status: form.values.status!,
        description: JSON.stringify(form.values.description),
        sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });

      navigate(paths.projectCheckInPath(res.checkIn.id));
    },
  });

  return (
    <Forms.Form form={form}>
      <Header />

      <div className={lastCheckIns.length > 0 ? "grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]" : ""}>
        <div>
          <Forms.FieldGroup>
            <StatusSection reviewer={project.reviewer || undefined} />
            <DescriptionSection project={project} />
          </Forms.FieldGroup>

          <Spacer size={4} />

          <SubscribersSelector {...subscriptionsState} />

          <Forms.FormError message="Fill out all the required fields" className="-mb-6 mt-4" />

          <Forms.Submit saveText="Submit" buttonSize="base" />
        </div>

        <LastCheckInReference checkIns={lastCheckIns} mentionedPersonLookup={mentionedPersonLookup} />
      </div>
    </Forms.Form>
  );
}

function Header() {
  return (
    <div>
      <div className="text-2xl font-bold mx-auto">Let's Check In</div>
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

function DescriptionSection({ project }: { project: Project }) {
  const mentionSearchScope = { type: "project", id: project.id! } as const;

  return (
    <Forms.RichTextArea
      label="2. What's new since the last check-in?"
      field="description"
      mentionSearchScope={mentionSearchScope}
      placeholder="Write your check-in here..."
    />
  );
}

function LastCheckInReference({
  checkIns,
  mentionedPersonLookup,
}: {
  checkIns: ReturnType<typeof parseCheckInsForTurboUi>;
  mentionedPersonLookup: ReturnType<typeof useRichEditorHandlers>["mentionedPersonLookup"];
}) {
  if (checkIns.length === 0) return null;

  return (
    <aside className="mt-8 lg:border-l lg:border-surface-outline lg:pl-6">
      <div className="font-bold mb-1.5">Last check-in</div>
      <LastCheckIn checkIns={checkIns} state="active" mentionedPersonLookup={mentionedPersonLookup} />
    </aside>
  );
}
