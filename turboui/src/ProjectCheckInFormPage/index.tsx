import React from "react";

import type { Person, ProjectCheckIn, ProjectCheckInStatus } from "../ApiTypes";
import { ActionLink, DimmedLink, Link } from "../Link";
import { Page } from "../Page";
import type { Navigation } from "../Page/Navigation";
import * as Forms from "../Forms";
import { StatusDisplay } from "../Forms/SelectStatus";
import FormattedTime, { type FormattedTimePreferences } from "../FormattedTime";
import { GhostButton } from "../Button";
import { InfoCallout } from "../Callouts";
import RichContent from "../RichContent";
import type { MentionedPersonLookupFn, RichEditorHandlers } from "../RichEditor/useEditor";
import { ScheduleFlowControls } from "../SchedulePosting";
import { useScheduleFlowState } from "../SchedulePosting/useScheduleFlowState";
import { Spacer } from "../Spacer";
import { StatusBadge } from "../StatusBadge";
import { SubscribersSelector } from "../Subscriptions";
import { displayDate } from "../utils/drafts";

export namespace ProjectCheckInFormPage {
  export interface Values extends Record<string, unknown> {
    status: ProjectCheckInStatus | null;
    description: unknown;
  }

  export type CreateAction = "submit" | "draft" | "schedule";
  export type EditAction = "save" | "publish" | "schedule" | "save-changes" | "publish-now" | "save-as-draft";

  export interface CreateSubmitMeta {
    mode: "create";
    action: CreateAction;
    scheduledAt: string | null;
  }

  export interface EditSubmitMeta {
    mode: "edit";
    action: EditAction;
    scheduledAt: string | null;
  }

  export type SubmitMeta = CreateSubmitMeta | EditSubmitMeta;

  export interface PreviousCheckIn {
    checkIn: ProjectCheckIn;
    link: string;
  }

  interface BaseProps {
    pageTitle: Page.Props["title"];
    navigation: Navigation.Item[];
    cancelLink: string;
    richTextHandlers: RichEditorHandlers;
    mentionedPersonLookup: MentionedPersonLookupFn;
    formattedTimePreferences: FormattedTimePreferences;
    reviewer?: Person | null;
    testId?: string;
    onSubmit: (values: Values, meta: SubmitMeta) => Promise<boolean>;
  }

  export interface CreateProps extends BaseProps {
    mode: "create";
    previousCheckIn?: PreviousCheckIn | null;
    subscriptions: SubscribersSelector.Props;
  }

  export interface EditProps extends BaseProps {
    mode: "edit";
    checkIn: ProjectCheckIn;
    allowFullEdit: boolean;
  }

  export type Props = CreateProps | EditProps;
}

export function ProjectCheckInFormPage(props: ProjectCheckInFormPage.Props) {
  const allowFullEdit = props.mode === "create" || props.allowFullEdit;
  const isUnpublished =
    props.mode === "edit" && (props.checkIn.state === "draft" || props.checkIn.state === "scheduled");
  const canSchedule = props.mode === "create" || isUnpublished;
  const scheduleFlow = useScheduleFlowState({
    initialScheduledAt: props.mode === "edit" && canSchedule ? props.checkIn.scheduledAt : null,
  });

  const form = Forms.useForm<ProjectCheckInFormPage.Values>({
    fields: {
      status: props.mode === "create" ? null : props.checkIn.status,
      description: props.mode === "create" ? null : JSON.parse(props.checkIn.description || "{}"),
    },
    validate: (addError) => {
      if (allowFullEdit && !form.values.status) {
        addError("status", "Status is required");
      }
      if (!form.values.description) {
        addError("description", "Description is required");
      }
    },
    submit: async (attrs?: unknown) => {
      const action = typeof attrs === "string" ? attrs : undefined;
      const status = form.values.status;
      const description = form.values.description;
      if (!status || !description) return;

      if (props.mode === "create") {
        const createAction = (action || "submit") as ProjectCheckInFormPage.CreateAction;
        const shouldSchedule =
          createAction === "schedule" || (createAction === "submit" && scheduleFlow.isScheduledLocally);

        await props.onSubmit(form.values, {
          mode: "create",
          action: createAction,
          scheduledAt: shouldSchedule ? scheduleFlow.scheduledAtIso : null,
        });
        return;
      }

      const editAction = (action || "save") as ProjectCheckInFormPage.EditAction;
      const shouldSchedule =
        editAction === "schedule" ||
        editAction === "save-changes" ||
        (editAction === "publish" && scheduleFlow.isScheduledLocally);

      await props.onSubmit(form.values, {
        mode: "edit",
        action: editAction,
        scheduledAt: shouldSchedule ? scheduleFlow.scheduledAtIso : null,
      });
    },
  });

  return (
    <Page
      title={props.pageTitle}
      navigation={props.navigation}
      testId={props.testId ?? (props.mode === "create" ? "project-check-in-new-page" : "project-check-in-edit-page")}
    >
      <main className="px-8 py-6 sm:px-10 sm:py-8">
        <Forms.Form form={form}>
          <Header props={props} />

          {props.mode === "edit" && (
            <FullEditDisabledMessage allowFullEdit={props.allowFullEdit} isUnpublished={isUnpublished} />
          )}

          <Forms.FieldGroup>
            <StatusSection
              reviewer={props.reviewer}
              allowFullEdit={allowFullEdit}
              status={props.mode === "edit" ? props.checkIn.status : null}
            />
            <DescriptionSection props={props} />
          </Forms.FieldGroup>

          <Spacer size={4} />

          {props.mode === "create" && <SubscribersSelector {...props.subscriptions} />}

          <Forms.FormError message="Fill out all the required fields" className="-mb-6 mt-4" />

          <SubmitButtons
            form={form}
            canSchedule={canSchedule}
            scheduleFlow={scheduleFlow}
            isScheduled={props.mode === "edit" && props.checkIn.state === "scheduled"}
            isCreate={props.mode === "create"}
            formattedTimePreferences={props.formattedTimePreferences}
            cancelLink={props.cancelLink}
          />
        </Forms.Form>
      </main>
    </Page>
  );
}

function Header({ props }: { props: ProjectCheckInFormPage.Props }) {
  if (props.mode === "create") {
    return (
      <div>
        <div className="text-2xl font-bold mx-auto">Let's Check In</div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-2xl font-bold mx-auto">
        Editing the Check-In from{" "}
        <FormattedTime {...props.formattedTimePreferences} time={displayDate(props.checkIn)} format="long-date" />
      </div>
    </div>
  );
}

function FullEditDisabledMessage({ allowFullEdit, isUnpublished }: { allowFullEdit: boolean; isUnpublished: boolean }) {
  if (isUnpublished || allowFullEdit) return null;

  return (
    <InfoCallout
      message="Editing locked after 3 days"
      description="You can edit the status for up to 3 days after submitting your check-in. After that, it's locked in to keep the history clear and decisions accountable. Need to make a change? Leave a comment or create a new check-in."
    />
  );
}

function StatusSection({
  reviewer,
  allowFullEdit,
  status,
}: {
  reviewer?: Person | null;
  allowFullEdit: boolean;
  status: ProjectCheckInStatus | null;
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

  if (!status) return null;

  return (
    <div className="mt-8 mb-4">
      <div className="font-bold">1. How's the project going?</div>
      <div className="mt-2 flex flex-col gap-2 rounded-lg border border-stroke-base p-2">
        <StatusDisplay status={status} reviewer={reviewer} />
      </div>
    </div>
  );
}

function DescriptionSection({ props }: { props: ProjectCheckInFormPage.Props }) {
  if (props.mode === "edit") {
    return (
      <Forms.RichTextArea
        label="2. What's new since the last check-in?"
        field="description"
        richTextHandlers={props.richTextHandlers}
        placeholder="Write your check-in here..."
      />
    );
  }

  return (
    <CreateDescriptionSection
      previousCheckIn={props.previousCheckIn}
      richTextHandlers={props.richTextHandlers}
      mentionedPersonLookup={props.mentionedPersonLookup}
      formattedTimePreferences={props.formattedTimePreferences}
    />
  );
}

function CreateDescriptionSection({
  previousCheckIn,
  richTextHandlers,
  mentionedPersonLookup,
  formattedTimePreferences,
}: {
  previousCheckIn?: ProjectCheckInFormPage.PreviousCheckIn | null;
  richTextHandlers: ProjectCheckInFormPage.CreateProps["richTextHandlers"];
  mentionedPersonLookup: ProjectCheckInFormPage.CreateProps["mentionedPersonLookup"];
  formattedTimePreferences: ProjectCheckInFormPage.CreateProps["formattedTimePreferences"];
}) {
  const [showPrevious, setShowPrevious] = React.useState(false);

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="font-bold">2. What's new since the last check-in?</div>

        {previousCheckIn && (
          <ActionLink
            className="text-sm font-medium"
            underline="hover"
            onClick={() => setShowPrevious((show) => !show)}
          >
            {showPrevious ? "Hide previous check-in" : "Show previous check-in"}
          </ActionLink>
        )}
      </div>

      {showPrevious && previousCheckIn && (
        <PreviousCheckInPreview
          previousCheckIn={previousCheckIn}
          mentionedPersonLookup={mentionedPersonLookup}
          formattedTimePreferences={formattedTimePreferences}
        />
      )}

      <Forms.RichTextArea
        field="description"
        richTextHandlers={richTextHandlers}
        placeholder="Write your check-in here..."
      />
    </div>
  );
}

function PreviousCheckInPreview({
  previousCheckIn,
  mentionedPersonLookup,
  formattedTimePreferences,
}: {
  previousCheckIn: ProjectCheckInFormPage.PreviousCheckIn;
  mentionedPersonLookup: ProjectCheckInFormPage.CreateProps["mentionedPersonLookup"];
  formattedTimePreferences: ProjectCheckInFormPage.CreateProps["formattedTimePreferences"];
}) {
  const { checkIn, link } = previousCheckIn;
  const content = JSON.parse(checkIn.description || "{}");
  const date = displayDate(checkIn);

  return (
    <div className="mb-3 mt-2 rounded border border-stroke-base p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-content-accent">Previous check-in</div>
          <div className="mt-0.5 text-sm text-content-dimmed">
            Posted by {checkIn.author?.fullName || "Unknown"} on{" "}
            <FormattedTime {...formattedTimePreferences} time={date} format="long-date" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <StatusBadge status={checkIn.status} hideIcon />
          <Link to={link} underline="hover" className="text-sm font-medium">
            View original
          </Link>
        </div>
      </div>

      <RichContent content={content} mentionedPersonLookup={mentionedPersonLookup} />
    </div>
  );
}

function SubmitButtons({
  form,
  canSchedule,
  scheduleFlow,
  isScheduled,
  isCreate,
  formattedTimePreferences,
  cancelLink,
}: {
  form: Forms.FormState<ProjectCheckInFormPage.Values>;
  canSchedule: boolean;
  scheduleFlow: ReturnType<typeof useScheduleFlowState>;
  isScheduled: boolean;
  isCreate: boolean;
  formattedTimePreferences: FormattedTimePreferences;
  cancelLink: string;
}) {
  const submit = (action: string) => {
    form.actions.setTrigger(action);
    form.actions.submit(action);
  };

  const isSubmitting = form.state === "submitting";

  if (!canSchedule) {
    return (
      <div className="mt-8">
        <Forms.Submit saveText="Submit" buttonSize="base" />
        <div className="mt-4">
          Or,{" "}
          <DimmedLink to={cancelLink} className="font-medium">
            Cancel
          </DimmedLink>
        </div>
      </div>
    );
  }

  if (isCreate) {
    return (
      <div className="mt-8">
        <ScheduleFlowControls
          scheduleFlow={scheduleFlow}
          primaryLabel="Submit"
          onPrimaryClick={() => submit(scheduleFlow.isScheduledLocally ? "schedule" : "submit")}
          loading={isSubmitting && (form.trigger === "submit" || form.trigger === "schedule")}
          testId="submit"
          formattedTimePreferences={formattedTimePreferences}
          modalTitle="Schedule Check-in"
          secondaryAction={
            <GhostButton
              loading={isSubmitting && form.trigger === "draft"}
              testId="save-as-draft"
              size="base"
              onClick={() => submit("draft")}
            >
              Save as draft
            </GhostButton>
          }
        />
        <div className="mt-4">
          Or,{" "}
          <DimmedLink to={cancelLink} className="font-medium">
            Cancel
          </DimmedLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <ScheduleFlowControls
        scheduleFlow={scheduleFlow}
        primaryLabel={isScheduled ? "Save Changes" : "Submit check-in"}
        onPrimaryClick={() =>
          submit(isScheduled ? "save-changes" : scheduleFlow.isScheduledLocally ? "schedule" : "publish")
        }
        loading={
          isSubmitting && (form.trigger === "save-changes" || form.trigger === "publish" || form.trigger === "schedule")
        }
        testId="publish-draft"
        formattedTimePreferences={formattedTimePreferences}
        modalTitle="Schedule Check-in"
        scheduledPrimaryLabel={isScheduled ? "Save Changes" : undefined}
        showScheduleOption={!isScheduled}
        secondaryAction={
          !isScheduled && (
            <GhostButton
              loading={isSubmitting && form.trigger === "save"}
              testId="save-draft"
              size="base"
              onClick={() => submit("save")}
            >
              Save draft
            </GhostButton>
          )
        }
        options={
          isScheduled
            ? [
                { label: "Publish now", action: () => submit("publish-now"), testId: "publish-now-option" },
                { label: "Save as draft", action: () => submit("save-as-draft"), testId: "save-as-draft-option" },
              ]
            : []
        }
      />
      <div className="mt-4">
        Or,{" "}
        <DimmedLink to={cancelLink} className="font-medium">
          Cancel
        </DimmedLink>
      </div>
    </div>
  );
}
