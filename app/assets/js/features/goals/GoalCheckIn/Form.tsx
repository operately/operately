import * as Goals from "@/models/goals";
import { parseCheckInsForTurboUi } from "@/models/goalCheckIns";
import * as People from "@/models/people";
import * as React from "react";

import { SubscriptionsState } from "@/models/subscriptions";
import { usePaths } from "@/routes/paths";

import { GoalTargetsField } from "@/features/goals/GoalTargetsV2";
import { durationHumanized } from "@/utils/time";
import { match } from "ts-pattern";
import {
  ActionLink,
  Checklist,
  DateField,
  FormattedTime,
  Forms,
  GhostButton,
  IconInfoCircle,
  InfoCallout,
  Link,
  RichContent,
  ScheduleFlowControls,
  StatusBadge,
  Tooltip,
  SubscribersSelector,
} from "turboui";
import { StatusSelector } from "./StatusSelector";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import type { GoalCheckInFormState } from "./useForm";

interface Props {
  form: GoalCheckInFormState;
  mode: "new" | "view" | "edit";
  goal: Goals.Goal;
  children?: React.ReactNode;
  subscriptionsState?: SubscriptionsState;
  isUnpublished?: boolean;

  // Full editing is allowed only for the latest check-in,
  // and allows editing the status, due date, and targets.
  // Otherwise, only the description can be due date.
  allowFullEdit: boolean;
}

interface CheckInReferenceProps {
  lastCheckIns: ReturnType<typeof parseCheckInsForTurboUi>;
  mentionedPersonLookup: ReturnType<typeof useRichEditorHandlers>["mentionedPersonLookup"];
}

export function Form(props: Props) {
  const paths = usePaths();
  const { mentionedPersonLookup } = useRichEditorHandlers();
  const lastCheckIns =
    props.mode === "new" && props.goal.lastCheckIn ? parseCheckInsForTurboUi(paths, [props.goal.lastCheckIn]) : [];

  return (
    <Forms.Form form={props.form} preventSubmitOnEnter>
      <div>
        <div className="space-y-8 mt-8">
          <FullEditDisabledMessage {...props} />
          <StatusAndDueDate {...props} />
          <Targets {...props} />
          <Checks {...props} />
          <Description {...props} lastCheckIns={lastCheckIns} mentionedPersonLookup={mentionedPersonLookup} />
        </div>

        <Subscribers {...props} />

        <Forms.FormError message="Fill out all the required fields" className="-mb-6 mt-4" />

        <SubmitSection {...props} />
      </div>
    </Forms.Form>
  );
}

function SubmitSection(props: Props) {
  if (props.mode === "view") return null;

  const formattedTimePreferences = useFormattedTimePreferences();
  const submit = (action: "submit" | "save-draft" | "publish-draft" | "schedule") => {
    props.form.actions.setTrigger(action);
    props.form.actions.submit(action);
  };

  const isSubmitting = props.form.state === "submitting";
  const { scheduleFlow, canSchedule } = props.form;

  if (props.mode === "new") {
    return (
      <div className="mt-8">
        <ScheduleFlowControls
          scheduleFlow={scheduleFlow}
          primaryLabel="Check-in"
          onPrimaryClick={() => submit(scheduleFlow.isScheduledLocally ? "schedule" : "submit")}
          loading={isSubmitting && (props.form.trigger === "submit" || props.form.trigger === "schedule")}
          testId="submit"
          formattedTimePreferences={formattedTimePreferences}
          secondaryAction={
            <GhostButton
              loading={isSubmitting && props.form.trigger === "save-draft"}
              testId="save-as-draft"
              size="base"
              onClick={() => submit("save-draft")}
            >
              Save as draft
            </GhostButton>
          }
        />
      </div>
    );
  }

  if (props.isUnpublished && canSchedule) {
    return (
      <div className="mt-8">
        <ScheduleFlowControls
          scheduleFlow={scheduleFlow}
          primaryLabel="Submit check-in"
          onPrimaryClick={() => submit(scheduleFlow.isScheduledLocally ? "schedule" : "publish-draft")}
          loading={isSubmitting && (props.form.trigger === "publish-draft" || props.form.trigger === "schedule")}
          testId="publish-draft"
          formattedTimePreferences={formattedTimePreferences}
          secondaryAction={
            <GhostButton
              loading={isSubmitting && props.form.trigger === "save-draft"}
              testId="save-draft"
              size="base"
              onClick={() => submit("save-draft")}
            >
              Save draft
            </GhostButton>
          }
        />
      </div>
    );
  }

  return <Forms.Submit saveText="Save" buttonSize="base" />;
}

function FullEditDisabledMessage({ mode, allowFullEdit }: Props) {
  if (mode !== "edit") return null;
  if (allowFullEdit) return null;

  return (
    <InfoCallout
      message={"Editing locked after 3 days"}
      description={
        "You can edit the due date, status, and target values for up to 3 days after submitting your check-in. After that, they’re locked in to keep the history clear and decisions accountable. Need to make a changes? Leave a comment or create a new check-in."
      }
    />
  );
}

function StatusAndDueDate(props: Props) {
  if (props.mode === "new" || (props.mode === "edit" && props.allowFullEdit)) {
    return <StatusAndDueDateForm goal={props.goal} />;
  } else {
    return <TextualOverview goal={props.goal} />;
  }
}

function TextualOverview({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="ProseMirror">
      <Label text="Overview" />
      <OverviewStatus goal={goal} /> <OverviewDueDate />
    </div>
  );
}

function OverviewStatus({ goal }: { goal: Goals.Goal }) {
  const [value] = Forms.useFieldValue("status");

  return match(value)
    .with("pending", () => <OverviewPending />)
    .with("on_track", () => <OverviewOnTrack />)
    .with("caution", () => <OverviewConcern goal={goal} />)
    .with("off_track", () => <OverviewIssue goal={goal} />)
    .run();
}

function OverviewPending() {
  return (
    <span>
      The goal is <span className="bg-stone-300 dark:bg-stone-600">pending</span>. Work has not started yet.
    </span>
  );
}

function OverviewOnTrack() {
  return (
    <span>
      The goal is <mark data-highlight="bgGreen">on track</mark>.
    </span>
  );
}

function OverviewConcern({ goal }: { goal: Goals.Goal }) {
  return (
    <span>
      The goal <mark data-highlight="bgYellow">needs caution</mark> due to emerging risks.
      {goal.reviewer && <span> {People.firstName(goal.reviewer)} should be aware.</span>}
    </span>
  );
}

function OverviewIssue({ goal }: { goal: Goals.Goal }) {
  return (
    <span>
      The goal is <mark data-highlight="bgRed">off track</mark> due to significant problems affecting success.
      {goal.reviewer && <span> {People.firstName(goal.reviewer)}'s help is needed.</span>}
    </span>
  );
}

function OverviewDueDate() {
  const [dueDate] = Forms.useFieldValue<DateField.ContextualDate | null>("dueDate");

  if (dueDate) {
    const { date } = dueDate;

    if (date < new Date()) {
      return (
        <span>
          {durationHumanized(date, new Date())} <mark data-highlight="bgRed">overdue</mark>.
        </span>
      );
    } else {
      return <span>{durationHumanized(new Date(), date)} until the deadline.</span>;
    }
  } else {
    return <span>No due date set.</span>;
  }
}

function StatusAndDueDateForm({ goal }: { goal: Goals.Goal }) {
  return (
    <Forms.FieldGroup>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:w-3/4">
        <GoalStatusSelector goal={goal} />
        <DueDateSelector />
      </div>
    </Forms.FieldGroup>
  );
}

function GoalStatusSelector({ goal }: { goal: Goals.Goal }) {
  const noReviewer = !goal.reviewer;
  const reviewerName = goal.reviewer ? People.firstName(goal.reviewer) : "";

  return (
    <div>
      <Label text="Status" />
      <StatusSelector field="status" reviewerFirstName={reviewerName} noReviewer={noReviewer} />
    </div>
  );
}

function Description(props: Props & CheckInReferenceProps) {
  if (props.mode === "view") {
    return <DescriptionView />;
  } else {
    return <DescriptionEdit {...props} />;
  }
}

function DescriptionView() {
  const [value] = Forms.useFieldValue("description");
  const { mentionedPersonLookup } = useRichEditorHandlers();

  return (
    <div>
      <Label text="Key wins, obstacles and needs" />
      <RichContent content={value} mentionedPersonLookup={mentionedPersonLookup} />
    </div>
  );
}

function DescriptionEdit({ goal, lastCheckIns, mentionedPersonLookup }: { goal: Goals.Goal } & CheckInReferenceProps) {
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "goal", id: goal.id! } });
  const [showPrevious, setShowPrevious] = React.useState(false);

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="font-bold">Describe key wins, obstacles and needs</div>

        {lastCheckIns.length > 0 && (
          <ActionLink
            className="text-sm font-medium"
            underline="hover"
            onClick={() => setShowPrevious((show) => !show)}
          >
            {showPrevious ? "Hide previous check-in" : "Show previous check-in"}
          </ActionLink>
        )}
      </div>

      {showPrevious && <PreviousCheckIn checkIns={lastCheckIns} mentionedPersonLookup={mentionedPersonLookup} />}

      <Forms.FieldGroup>
        <Forms.RichTextArea
          field="description"
          placeholder="Write here..."
          richTextHandlers={richTextHandlers}
          required
        />
      </Forms.FieldGroup>
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

function Label({ text, info, className = "" }: { text: string; className?: string; info?: string }) {
  const infoPopup = info ? (
    <Tooltip content={info}>
      <IconInfoCircle size={14} className="inline-block  -mt-0.5 text-content-dimmed hover:text-content-base" />
    </Tooltip>
  ) : null;

  return (
    <div className={"font-bold mb-1.5 " + className}>
      {text} {infoPopup}
    </div>
  );
}

function DueDateSelector() {
  const [value, setValue] = Forms.useFieldValue<DateField.ContextualDate | null>("dueDate");

  return (
    <div>
      <Label text="Due Date" info="Set a new due date for the goal." />
      <DateField
        date={value ?? null}
        onDateSelect={(date) => setValue(date)}
        variant="form-field"
        placeholder="No due date set"
      />
    </div>
  );
}

function Targets(props: Props) {
  const targetCount = useTargetCount();
  const label = targetSectionLabel(targetCount, props.mode, props.allowFullEdit!);

  if (targetCount === 0) {
    return null;
  }

  const readonly = props.mode === "view" || (props.mode === "edit" && !props.allowFullEdit);

  return (
    <div>
      <Label text={label} />
      <GoalTargetsField field="targets" readonly={readonly} />
    </div>
  );
}

function targetSectionLabel(targetCount: number, mode: Props["mode"], allowFullEdit: boolean) {
  if ((mode === "edit" && allowFullEdit) || mode === "new") {
    if (targetCount === 1) {
      return "Update Target";
    } else {
      return "Update Targets";
    }
  } else {
    if (targetCount === 1) {
      return "Target";
    } else {
      return "Targets";
    }
  }
}

function useTargetCount(): number {
  const [targets] = Forms.useFieldValue<any[]>("targets");
  return targets?.length ?? 0;
}

function Subscribers(props: Props) {
  if (props.mode !== "new") return null;
  if (!props.subscriptionsState) return null;

  return (
    <div className="mt-6">
      <SubscribersSelector {...props.subscriptionsState} />
    </div>
  );
}

function Checks(props: Props) {
  const [items, setItems] = Forms.useFieldValue<Goals.Check[]>("checklist");

  if (!items || items.length === 0) {
    return null;
  }

  const noOp = async (...args: any[]) => {
    console.warn("Checklist operation not allowed in this mode", ...args);
    return Promise.resolve({} as any);
  };

  const toggle = async (id: string) => {
    const updatedItems = items.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i));
    setItems(updatedItems);
    return true;
  };

  const updateItemIndex = async (id: string, newIndex: number) => {
    const updatedItems = [...items];
    const itemIndex = updatedItems.findIndex((i) => i.id === id);
    if (itemIndex === -1) return false;
    const [item] = updatedItems.splice(itemIndex, 1);
    if (item) {
      updatedItems.splice(newIndex, 0, item);
    }
    setItems(updatedItems);
    return true;
  };

  return (
    <Checklist
      items={items.map((item) => ({ ...item, mode: "view" as const }))}
      canEdit={false}
      addItem={noOp}
      deleteItem={noOp}
      updateItem={noOp}
      toggleItem={toggle}
      updateItemIndex={updateItemIndex}
      sectionTitle={props.mode === "view" ? "Checklist" : "Update Checklist"}
      togglable={props.mode !== "view"}
      disabled={true}
    />
  );
}
