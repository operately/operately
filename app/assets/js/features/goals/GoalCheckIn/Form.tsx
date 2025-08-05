import * as Goals from "@/models/goals";
import * as People from "@/models/people";
import * as React from "react";

import { SubscribersSelector, SubscriptionsState } from "@/features/Subscriptions";

import { InfoCallout } from "@/components/Callouts";
import Forms from "@/components/Forms";
import { useFieldValue } from "@/components/Forms/FormContext";
import RichContent from "@/components/RichContent";
import { GoalTargetsField } from "@/features/goals/GoalTargetsV2";
import { assertPresent } from "@/utils/assertions";
import { durationHumanized } from "@/utils/time";
import { match } from "ts-pattern";
import { Checklist, DateField, IconInfoCircle, Tooltip } from "turboui";
import { StatusSelector } from "./StatusSelector";

interface Props {
  form: any;
  mode: "new" | "view" | "edit";
  goal: Goals.Goal;
  children?: React.ReactNode;
  subscriptionsState?: SubscriptionsState;

  // Full editing is allowed only for the latest check-in,
  // and allows editing the status, due date, and targets.
  // Otherwise, only the description can be due date.
  allowFullEdit: boolean;
}

export function Form(props: Props) {
  return (
    <Forms.Form form={props.form} preventSubmitOnEnter>
      <div className="space-y-8 mt-8">
        <FullEditDisabledMessage {...props} />
        <StatusAndDueDate {...props} />
        <Targets {...props} />
        <Checks {...props} />
        <Description {...props} />
      </div>

      <Subscribers {...props} />
      <SubmitSection {...props} />
    </Forms.Form>
  );
}

function SubmitSection(props: Props) {
  if (props.mode === "view") return null;

  const text = match(props.mode)
    .with("new", () => "Check-in")
    .with("edit", () => "Save")
    .run();

  return <Forms.Submit saveText={text} buttonSize="base" />;
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

function Description(props: Props) {
  if (props.mode === "view") {
    return <DescriptionView />;
  } else {
    return <DescriptionEdit {...props} />;
  }
}

function DescriptionView() {
  const [value] = Forms.useFieldValue("description");

  return (
    <div>
      <Label text="Key wins, obstacles and needs" />
      <RichContent jsonContent={value} skipParse />
    </div>
  );
}

function DescriptionEdit({ goal }: { goal: Goals.Goal }) {
  const mentionSearchScope = { type: "goal", id: goal.id! } as const;

  return (
    <div>
      <Label text="Describe key wins, obstacles and needs" />
      <Forms.FieldGroup>
        <Forms.RichTextArea
          field="description"
          placeholder="Write here..."
          mentionSearchScope={mentionSearchScope}
          required
        />
      </Forms.FieldGroup>
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
      <DateField date={value} onDateSelect={setValue} variant="form-field" placeholder="No due date set" />
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
  return useFieldValue<any[]>("targets")[0].length;
}

function Subscribers(props: Props) {
  if (props.mode !== "new") return null;

  assertPresent(props.goal.potentialSubscribers, "potentialSubscribers must be present in goal");

  return (
    <div className="mt-6">
      <SubscribersSelector state={props.subscriptionsState!} spaceName={props.goal!.space!.name!} />
    </div>
  );
}

function Checks(props: Props) {
  const [items, setItems] = React.useState<Checklist.ChecklistItem[]>([]);

  if (items.length === 0) {
    return null;
  }

  const noOp = async (...args: any[]) => {
    console.warn("Checklist operation not allowed in this mode", ...args);
    return Promise.resolve({} as any);
  };

  const toggle = async (item: Checklist.ChecklistItem) => {
    const updatedItems = items.map((i) => (i.id === item.id ? { ...i, completed: !i.completed } : i));

    setItems(updatedItems);
    return Promise.resolve({} as any);
  };

  return (
    <Checklist
      items={items}
      canEdit={false}
      addItem={noOp}
      deleteItem={noOp}
      updateItem={noOp}
      toggleItem={toggle}
      updateItemIndex={noOp}
    />
  );
}
