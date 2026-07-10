import React from "react";

import { Person } from "@/models/people";
import { parseCheckInsForTurboUi, usePostProjectCheckIn, ProjectCheckInStatus } from "@/models/projectCheckIns";
import { Project } from "@/models/projects";
import { useNavigate } from "react-router";

import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import {
  ActionLink,
  FormattedTime,
  Forms,
  GhostButton,
  Link,
  PrimaryButton,
  RichContent,
  Spacer,
  StatusBadge,
  SubscribersSelector,
  type FormState,
} from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
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
    submit: async (action: "submit" | "draft" = "submit") => {
      const status = form.values.status;
      const description = form.values.description;
      if (!status || !description) return;

      const res = await post({
        projectId: project.id,
        status,
        description: JSON.stringify(description),
        postAsDraft: action === "draft",
        sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });

      navigate(paths.projectCheckInPath(res.checkIn.id));
    },
  });

  return (
    <Forms.Form form={form}>
      <Header />

      <Forms.FieldGroup>
        <StatusSection reviewer={project.reviewer || undefined} />
        <DescriptionSection
          project={project}
          lastCheckIns={lastCheckIns}
          mentionedPersonLookup={mentionedPersonLookup}
        />
      </Forms.FieldGroup>

      <Spacer size={4} />

      <SubscribersSelector {...subscriptionsState} />

      <Forms.FormError message="Fill out all the required fields" className="-mb-6 mt-4" />

      <SubmitButtons form={form} />
    </Forms.Form>
  );
}

function SubmitButtons({ form }: { form: FormState<{ status: ProjectCheckInStatus | null; description: any }> }) {
  const submit = (action: "submit" | "draft") => {
    form.actions.setTrigger(action);
    form.actions.submit(action);
  };

  const isSubmitting = form.state === "submitting";

  return (
    <div className="mt-8 flex items-center gap-2">
      <PrimaryButton
        loading={isSubmitting && form.trigger === "submit"}
        testId="submit"
        size="base"
        onClick={() => submit("submit")}
      >
        Submit
      </PrimaryButton>

      <GhostButton
        loading={isSubmitting && form.trigger === "draft"}
        testId="save-as-draft"
        size="base"
        onClick={() => submit("draft")}
      >
        Save as draft
      </GhostButton>
    </div>
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

function DescriptionSection({
  project,
  lastCheckIns,
  mentionedPersonLookup,
}: {
  project: Project;
  lastCheckIns: ReturnType<typeof parseCheckInsForTurboUi>;
  mentionedPersonLookup: ReturnType<typeof useRichEditorHandlers>["mentionedPersonLookup"];
}) {
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "project", id: project.id! } });
  const [showPrevious, setShowPrevious] = React.useState(false);

  return (
    <div>
      <DescriptionLabel
        hasPreviousCheckIn={lastCheckIns.length > 0}
        showPrevious={showPrevious}
        onToggle={() => setShowPrevious((show) => !show)}
      />

      {showPrevious && <PreviousCheckIn checkIns={lastCheckIns} mentionedPersonLookup={mentionedPersonLookup} />}

      <Forms.RichTextArea
        field="description"
        richTextHandlers={richTextHandlers}
        placeholder="Write your check-in here..."
      />
    </div>
  );
}

function DescriptionLabel({
  hasPreviousCheckIn,
  showPrevious,
  onToggle,
}: {
  hasPreviousCheckIn: boolean;
  showPrevious: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
      <div className="font-bold">2. What's new since the last check-in?</div>

      {hasPreviousCheckIn && (
        <ActionLink className="text-sm font-medium" underline="hover" onClick={onToggle}>
          {showPrevious ? "Hide previous check-in" : "Show previous check-in"}
        </ActionLink>
      )}
    </div>
  );
}

function PreviousCheckIn({
  checkIns,
  mentionedPersonLookup,
}: {
  checkIns: ReturnType<typeof parseCheckInsForTurboUi>;
  mentionedPersonLookup: ReturnType<typeof useRichEditorHandlers>["mentionedPersonLookup"];
}) {
  const formattedTimePreferences = useFormattedTimePreferences();
  const checkIn = checkIns[0];
  if (!checkIn) return null;

  return (
    <div className="mb-3 mt-2 rounded border border-stroke-base p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-content-accent">Previous check-in</div>
          <div className="mt-0.5 text-sm text-content-dimmed">
            Posted by {checkIn.author?.fullName || "Unknown"} on{" "}
            <FormattedTime {...formattedTimePreferences} time={checkIn.date} format="long-date" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <StatusBadge status={checkIn.status} hideIcon />
          <Link to={checkIn.link} underline="hover" className="text-sm font-medium">
            View original
          </Link>
        </div>
      </div>

      <RichContent content={checkIn.content} mentionedPersonLookup={mentionedPersonLookup} />
    </div>
  );
}
