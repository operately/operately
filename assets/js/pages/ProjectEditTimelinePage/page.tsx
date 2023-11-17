import * as React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import Button, { GhostButton } from "@/components/Button";

import * as Time from "@/utils/time";
import * as Milestones from "@/graphql/Projects/milestones";

import { DateSelector } from "./DateSelector";

import { useLoadedData } from "./loader";
import { useForm } from "./useForm";

import FormattedTime from "@/components/FormattedTime";

export function Page() {
  const { project } = useLoadedData();
  const form = useForm(project);

  return (
    <Pages.Page title={["Edit Project Timeline", project.name]}>
      <Paper.Root size="small">
        <Paper.Navigation>
          <Paper.NavItem linkTo={`/projects/${project.id}`}>
            <Icons.IconClipboardList size={16} />
            {project.name}
          </Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body minHeight="none">
          <h1 className="mb-12 font-extrabold text-content-accent text-3xl text-center">
            Editing the project timeline
          </h1>

          <div className="flex items-start gap-4">
            <StartDate form={form} />
            <DueDate form={form} />
          </div>

          <Section title="Milestones" />
          <MilestoneList form={form} />

          {form.hasChanges && (
            <>
              <Section title="Summary" />
              <Summary form={form} />

              <div className="mt-12 flex items-center justify-center">
                <GhostButton type="primary" onClick={form.submit} testId="save">
                  Save timeline changes
                </GhostButton>
              </div>
            </>
          )}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Section({ title }) {
  return (
    <div className="mt-8 flex items-center gap-2">
      <div className="flex-1 border-b border-surface-outline"></div>
      <h1 className="uppercase font-semibold text-content-accent py-1 px-2 text-xs">{title}</h1>
      <div className="flex-1 border-b border-surface-outline"></div>
    </div>
  );
}

function MilestoneList({ form }) {
  return (
    <div className="flex flex-col gap-2 my-3">
      {form.existingMilestones.map((m: Milestones.Milestone) => (
        <Milestone key={m.id} milestone={m} form={form} />
      ))}

      {form.newMilestones.map((m: Milestones.Milestone) => (
        <Milestone key={m.id} milestone={m} form={form} />
      ))}

      <AddMilestone form={form} />
    </div>
  );
}

function AddMilestone({ form }) {
  const [active, setActive] = React.useState(false);

  const close = React.useCallback(() => {
    setActive(false);
  }, []);

  if (active) {
    return <AddMilestoneForm form={form} close={close} />;
  } else {
    return <AddMilestoneButton onClick={() => setActive(true)} />;
  }
}

function AddMilestoneButton({ onClick }) {
  return (
    <div
      className="py-2 px-3 border border-surface-outline bg-surface-accent rounded cursor-pointer hover:bg-surface-dimmed"
      onClick={onClick}
      data-test-id="add-milestone"
    >
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-1 text-content-dimmed font-medium">
          <Icons.IconPlus size={16} className="text-content-dimmed shrink-0" />
          Add milestone
        </div>
      </div>
    </div>
  );
}

function AddMilestoneForm({ form, close }) {
  const [title, setTitle] = React.useState("");
  const [dueDate, setDueDate] = React.useState<Date | null>(null);

  const valid = React.useMemo(() => {
    return title.length > 0 && dueDate;
  }, [title, dueDate]);

  const addMilestone = React.useCallback(() => {
    if (!valid) return;
    if (!dueDate) return;

    form.addNewMilestone({
      id: Math.random().toString(36),
      title,
      deadlineAt: dueDate.toISOString(),
    });
    close();
  }, [valid, title, dueDate]);

  return (
    <div className="bg-surface px-3 py-3 border border-surface-outline rounded">
      <div className="uppercase text-xs mb-2">New milestone</div>

      <div className="flex items-center gap-2 ">
        <div className="w-2/3 shrink-0">
          <input
            type="text"
            autoFocus
            className="w-full bg-surface-accent rounded px-2 py-1 outline-none border border-surface-outline ring-0"
            placeholder="ex. Website launch"
            value={title}
            data-test-id="new-milestone-title"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="w-1/3 flex items-center gap-2">
          <div className="flex-1">
            <DateSelector
              date={dueDate}
              onChange={setDueDate}
              minDate={form.startTime}
              maxDate={form.dueDate}
              placeholder="Select due date"
              testID="new-milestone-due"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          size="small"
          type="submit"
          variant="success"
          onClick={addMilestone}
          disabled={!valid}
          data-test-id="add-milestone-button"
        >
          Add
        </Button>
        <Button size="small" type="button" variant="secondary" onClick={close}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function Milestone({ milestone, form }) {
  return (
    <div
      className="py-2 px-3 border border-surface-outline bg-surface-accent rounded"
      data-test-id={milestoneTestID(milestone)}
    >
      <div className="flex flex-col flex-1">
        <div className="font-bold flex items-center gap-1">
          <Icons.IconFlagFilled size={16} className="text-accent-1 shrink-0" />
          {milestone.title}
        </div>

        <div className="text-sm">
          Deadline: <FormattedTime time={Time.parse(milestone.deadlineAt)} format="short-date" />
        </div>

        <div className="flex items-center gap-2">
          {milestone.deletable && (
            <div
              className="rounded-full bg-surface-dimmed hover:bg-surface-accent p-1 cursor-pointer"
              onClick={() => form.removeMilestone(milestone.id)}
            >
              <Icons.IconTrash size={16} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function milestoneTestID(milestone: Milestones.Milestone) {
  return "milestone-" + milestone.title.toLowerCase().replace(/\s+/g, "-") + "-due";
}

function StartDate({ form }) {
  return (
    <div className="flex flex-col gap-1 flex-1">
      <div className="uppercase text-xs text-content-accent font-bold">Start Date</div>
      <div className="flex-1">
        <DateSelector
          date={form.startTime}
          onChange={form.setStartTime}
          minDate={null}
          maxDate={form.dueDate}
          testID={"project-start"}
        />
      </div>
    </div>
  );
}

function DueDate({ form }) {
  return (
    <div className="flex flex-col gap-1 flex-1">
      <div className="uppercase text-xs text-content-accent font-bold">Due Date</div>
      <div className="flex-1">
        <DateSelector
          date={form.dueDate}
          onChange={form.setDueDate}
          minDate={form.startTime}
          maxDate={null}
          testID={"project-due"}
        />
      </div>
    </div>
  );
}

function Summary({ form }) {
  if (!form.startTime) return null;
  if (!form.dueDate) return null;

  return (
    <div className="mt-4">
      <div className="">
        Total project duration is {Time.daysBetween(form.startTime, form.dueDate)} days. (~
        {Time.humanDuration(form.startTime, form.dueDate)}).
      </div>
      {form.newMilestones.length > 0 && (
        <div className="mt-2">
          {form.newMilestones.length > 1 ? form.newMilestones.length + "new milestones have" : "One new milestone has"}{" "}
          been added.
        </div>
      )}
    </div>
  );
}
