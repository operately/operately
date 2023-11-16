import * as React from "react";

import * as Projects from "@/graphql/Projects";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import Button from "@/components/Button";
import * as Time from "@/utils/time";
import * as Milestones from "@/graphql/Projects/milestones";

import { DateSelector } from "./DateSelector";

import { useLoadedData } from "./loader";
import { useForm } from "./useForm";

export function Page() {
  const { project } = useLoadedData();

  const form = useForm(project);

  const originalDuration = React.useMemo(() => calculateOriginalDuration(project), [project]);

  return (
    <Pages.Page title={["Edit Project Timeline", project.name]}>
      <Paper.Root size="medium">
        <Paper.Navigation>
          <Paper.NavItem linkTo={`/projects/${project.id}`}>
            <Icons.IconClipboardList size={16} />
            {project.name}
          </Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body minHeight="none">
          <h1 className="mb-8 font-extrabold text-content-accent text-3xl">Editing the project timeline</h1>

          <div className="flex items-start gap-4">
            <StartDate form={form} />
            <DueDate form={form} />
          </div>
          <Duration form={form} />

          <h1 className="font-extrabold text-content-accent text-xl mt-8 mb-4">Milestones</h1>
          <MilestoneList
            milestones={form.newMilestones}
            setMilestones={form.addNewMilestone}
            projectStart={form.startTime}
            projectEnd={form.dueDate}
          />

          <div className="mt-8 flex items-center gap-2">
            <Button type="submit" variant="success" onClick={form.submit} loading={form.submitting} data-test-id="save">
              Save
            </Button>
            <Button type="button" variant="secondary" linkTo={`/projects/${project.id}`}>
              Cancel
            </Button>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function MilestoneList({ milestones, setMilestones, projectStart, projectEnd }) {
  return (
    <div className="flex flex-col gap-2">
      {milestones.map((m: Milestones.Milestone) => (
        <Milestone
          key={m.id}
          milestone={m}
          setMilestones={setMilestones}
          projectStart={projectStart}
          projectEnd={projectEnd}
        />
      ))}
      <AddMilestone setMilestones={setMilestones} projectStart={projectStart} projectEnd={projectEnd} />
    </div>
  );
}

function AddMilestone({ setMilestones, projectStart, projectEnd }) {
  const [active, setActive] = React.useState(false);

  const close = React.useCallback(() => {
    setActive(false);
  }, []);

  if (active) {
    return (
      <AddMilestoneForm
        setMilestones={setMilestones}
        projectStart={projectStart}
        projectEnd={projectEnd}
        close={close}
      />
    );
  } else {
    return <AddMilestoneButton onClick={() => setActive(true)} />;
  }
}

function AddMilestoneButton({ onClick }) {
  return (
    <div
      className="underline cursor-pointer text-content-dimmed hover:text-content-accent"
      data-test-id="add-milestone"
      onClick={onClick}
    >
      + Add milestone
    </div>
  );
}

function AddMilestoneForm({ setMilestones, projectStart, projectEnd, close }) {
  const [title, setTitle] = React.useState("");
  const [dueDate, setDueDate] = React.useState<Date | null>(null);

  const addMilestone = React.useCallback(() => {
    setMilestones((m: any) => [
      ...m,
      {
        id: Math.random().toString(),
        title,
        deadlineAt: dueDate?.toISOString(),
        status: "pending",
        deletable: true,
      },
    ]);

    close();
  }, [title, dueDate]);

  const valid = React.useMemo(() => {
    return title.length > 0 && dueDate;
  }, [title, dueDate]);

  return (
    <div className="bg-surface px-3 py-3">
      <div className="uppercase text-content-dimmed text-sm mb-2">New milestone</div>

      <div className="flex items-center gap-2 ">
        <div className="w-2/3 shrink-0">
          <input
            type="text"
            autoFocus
            className="w-full bg-surface-accent rounded px-2 py-1 outline-none border-none"
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
              minDate={projectStart}
              maxDate={projectEnd}
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

function Milestone({ milestone, setMilestones, projectStart, projectEnd }) {
  const setDueDate = React.useCallback((date: Date) => {
    setMilestones((m: any) => {
      const index = m.findIndex((m) => m.id === milestone.id);
      if (index === -1) return m;

      const newMilestones = [...m];

      newMilestones[index] = {
        ...newMilestones[index],
        deadlineAt: date.toISOString(),
      };

      return newMilestones;
    });
  }, []);

  const removeMilestone = React.useCallback(() => {
    setMilestones((m: any) => {
      const index = m.findIndex((m) => m.id === milestone.id);
      if (index === -1) return m;

      const newMilestones = [...m];
      newMilestones.splice(index, 1);

      return newMilestones;
    });
  }, []);

  const testId = "milestone-" + milestone.title.toLowerCase().replace(/\s+/g, "-") + "-due";

  return (
    <div className="flex items-center gap-2">
      <div className="w-2/3">{milestone.title}</div>
      <div className="w-1/3 flex items-center gap-2">
        <div className="flex-1">
          <DateSelector
            date={Time.parse(milestone.deadlineAt)}
            onChange={setDueDate}
            minDate={projectStart}
            maxDate={projectEnd}
            testID={testId}
          />
        </div>

        {milestone.deletable && (
          <div
            className="rounded-full bg-surface-dimmed hover:bg-surface-accent p-1 cursor-pointer"
            onClick={removeMilestone}
          >
            <Icons.IconTrash size={16} />
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryOfChanges({ originalDuration, newDuration }) {
  if (originalDuration === newDuration) return null;

  return (
    <div className="border-t border-stroke-base mt-8 pt-8">
      <h1 className="font-extrabold text-content-accent mb-2">Summary Of Changes</h1>

      <div>
        - <ProjectDurationChange originalDuration={originalDuration} newDuration={newDuration} />
      </div>
    </div>
  );
}

function calculateOriginalDuration(project: Projects.Project) {
  if (!project.startedAt) return null;
  if (!project.phaseHistory) return null;
  if (!project.phaseHistory.length) return null;
  if (!project.phaseHistory.find((p) => p.phase === "control")) return null;
  if (!project.phaseHistory.find((p) => p.phase === "control")?.dueTime) return null;

  const projectStart = Time.parse(project.startedAt);
  const projectEnd = Time.parse(project.phaseHistory.find((p) => p.phase === "control")?.dueTime);

  if (!projectStart || !projectEnd) return null;

  return Time.daysBetween(projectStart, projectEnd);
}

function ProjectDurationChange({ originalDuration, newDuration }) {
  if (originalDuration === newDuration) return null;
  if (!originalDuration) {
    return <>The project timeline was defined. It will take {newDuration} days.</>;
  }

  if (originalDuration > newDuration) {
    return (
      <>
        Project duration was shortened from {originalDuration} days to {newDuration} days.
      </>
    );
  } else {
    return (
      <>
        Project duration was extended from {originalDuration} days to {newDuration} days.
      </>
    );
  }
}

function StartDate({ form }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="uppercase text-xs text-content-accent font-bold">Start Date</div>
      <div className="w-40">
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
    <div className="flex flex-col gap-1">
      <div className="uppercase text-xs text-content-accent font-bold">Due Date</div>
      <div className="w-40">
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

function Duration({ form }) {
  if (!form.startTime) return null;
  if (!form.dueDate) return null;

  return <div className="mt-2">Total duration is aproximately {Time.humanDuration(form.startTime, form.dueDate)}.</div>;
}
