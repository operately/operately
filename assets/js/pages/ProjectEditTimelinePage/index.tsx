import * as React from "react";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { useDocumentTitle } from "@/layouts/header";

import { ProjectLifecycleGraph } from "@/components/ProjectLifecycleGraph";

import * as Popover from "@radix-ui/react-popover";
import DatePicker from "react-datepicker";
import FormattedTime from "@/components/FormattedTime";
import Button from "@/components/Button";
import * as Time from "@/utils/time";
import * as Milestones from "@/graphql/Projects/milestones";

interface LoaderData {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderData> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  return {
    project: projectData.data.project,
  };
}

export function Page() {
  const [{ project }] = Paper.useLoadedData() as [LoaderData];

  useDocumentTitle(`Edit Project Timeline - ${project.name}`);

  const originalDuration = React.useMemo(() => calculateOriginalDuration(project), [project]);

  const [dates, setDates] = React.useState({
    projectStart: Time.parse(project.startedAt),
    planningDue: Time.parse(project.phaseHistory.find((p) => p.phase === "planning")?.dueTime || null),
    executionDue: Time.parse(project.phaseHistory.find((p) => p.phase === "execution")?.dueTime || null),
    controlDue: Time.parse(project.phaseHistory.find((p) => p.phase === "control")?.dueTime || null),
  });

  const [milestonesState, setMilestones] = React.useState(project.milestones);
  const pendingMilestones = React.useMemo(
    () => milestonesState.filter((m) => m.status === "pending"),
    [milestonesState],
  );

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <h1 className="mb-8 font-extrabold text-white-1 text-3xl">Editing the project timeline</h1>

        <div className="bg-dark-2 rounded-lg overflow-hidden">
          <ProjectLifecycleGraph
            projectStart={dates.projectStart}
            projectEnd={dates.controlDue}
            planningDue={dates.planningDue}
            executionDue={dates.executionDue}
            controlDue={dates.controlDue}
            milestones={milestonesState}
          />
        </div>

        <h1 className="font-extrabold text-white-1 text-xl mt-8 mb-4">Project Phases</h1>
        <Phases dates={dates} setDates={setDates} />

        <h1 className="font-extrabold text-white-1 text-xl mt-8 mb-4">Milestones</h1>
        <Millstones
          milestones={pendingMilestones}
          setMilestones={setMilestones}
          projectStart={dates.projectStart}
          projectEnd={dates.controlDue}
        />

        <SummaryOfChanges
          originalDuration={originalDuration}
          newDuration={Time.daysBetween(dates.projectStart, dates.controlDue)}
          originalMilestones={project.milestones}
          newMilestones={milestonesState}
        />

        <div className="mt-8 flex items-center gap-2">
          <Button type="submit" variant="success">
            Save
          </Button>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

function Phases({ dates, setDates }) {
  const setDate = React.useCallback(
    (phase: string) => (date: Date) => {
      setDates((d: any) => ({ ...d, [phase]: date }));
    },
    [],
  );

  return (
    <div className="flex flex-col gap-2">
      <PhaseDatesForm
        phaseName="Planning Phase"
        startTime={dates.projectStart}
        dueDate={dates.planningDue}
        setStart={setDate("projectStart")}
        setDue={setDate("planningDue")}
        minStart={null}
        maxStart={dates.planningDue}
        minDue={dates.projectStart}
        maxDue={dates.executionDue}
      />
      <PhaseDatesForm
        phaseName="Execution Phase"
        startTime={dates.planningDue}
        dueDate={dates.executionDue}
        setStart={setDate("planningDue")}
        setDue={setDate("executionDue")}
        minStart={dates.projectStart}
        maxStart={dates.executionDue}
        minDue={dates.planningDue}
        maxDue={dates.controlDue}
      />
      <PhaseDatesForm
        phaseName="Control Phase"
        startTime={dates.executionDue}
        dueDate={dates.controlDue}
        setStart={setDate("executionDue")}
        setDue={setDate("controlDue")}
        minStart={dates.planningDue}
        maxStart={dates.controlDue}
        minDue={dates.executionDue}
        maxDue={null}
      />
    </div>
  );
}

function PhaseDatesForm({ phaseName, startTime, dueDate, setStart, setDue, minStart, maxStart, minDue, maxDue }) {
  return (
    <div className="flex items-center">
      <div className="w-40">{phaseName}</div>

      <div className="flex items-center gap-2 flex-1">
        <div className="w-40">
          <DateSelector date={startTime} onChange={setStart} minDate={minStart} maxDate={maxStart} />
        </div>
        <Icons.IconArrowRight size={16} className="shrink-0" />
        <div className="w-40">
          <DateSelector date={dueDate} onChange={setDue} minDate={minDue} maxDate={maxDue} />
        </div>
      </div>
    </div>
  );
}

function DateSelector({ date, onChange, minDate, maxDate }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div
          className="bg-dark-4 hover:bg-dark-6 rounded px-2 py-1 relative group cursor-pointer w-full outline-none"
          onClick={() => setOpen(true)}
          data-test-id="change-milestone-due-date"
        >
          {date ? <FormattedTime time={date} format="short-date" /> : "Not set"}
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="outline-red-400 border border-dark-8" align="start">
          <DatePicker
            inline
            selected={date}
            onChange={onChange}
            minDate={minDate}
            maxDate={maxDate}
            className="border-none"
          ></DatePicker>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Millstones({ milestones, setMilestones, projectStart, projectEnd }) {
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

  return (
    <div className="flex items-center gap-2">
      <div className="w-2/3">{milestone.title}</div>
      <div className="w-1/3">
        <div className="flex-1">
          <DateSelector
            date={Time.parse(milestone.deadlineAt)}
            onChange={setDueDate}
            minDate={projectStart}
            maxDate={projectEnd}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryOfChanges({ originalDuration, newDuration }) {
  if (originalDuration === newDuration) return null;

  return (
    <div className="border-t border-dark-8 mt-8 pt-8">
      <h1 className="font-extrabold text-white-1 mb-2">Summary Of Changes</h1>

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
