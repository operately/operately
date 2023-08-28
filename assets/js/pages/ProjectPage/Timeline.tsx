import React from "react";

import { useNavigate } from "react-router-dom";

import FormattedTime from "@/components/FormattedTime";
import DatePicker from "react-datepicker";

import * as SelectBox from "@/components/SilentSelectBox";
import * as Projects from "@/graphql/Projects";
import * as Time from "@/utils/time";
import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as Milestones from "@/graphql/Projects/milestones";

import Button from "@/components/Button";
import ProjectHealthSelector from "@/components/ProjectHealthSelector";
import ProjectPhaseSelector from "@/components/ProjectPhaseSelector";

interface ContextDescriptor {
  project: Projects.Project;
  refetch: () => void;
  editable: boolean;
}

const Context = React.createContext<ContextDescriptor | null>(null);

export default function Timeline({ project, refetch, editable }) {
  return (
    <Context.Provider value={{ project, refetch, editable }}>
      <Timeline2 project={project} refetch={refetch} />
    </Context.Provider>
  );
}

function Label({ title }) {
  return <div className="font-bold text-sm ml-1">{title}</div>;
}

function Health() {
  const { project, editable } = React.useContext(Context) as ContextDescriptor;

  const navigate = useNavigate();

  const handleHealthChange = (phase: string) => {
    navigate(`/projects/${project.id}/updates/new?messageType=health_change&health=${phase}`);
  };

  return (
    <div className="flex flex-col">
      <Label title="Health" />
      <ProjectHealthSelector editable={editable} active={project.health} onSelected={handleHealthChange} />
    </div>
  );
}

function Phase() {
  const { project, editable } = React.useContext(Context) as ContextDescriptor;
  const navigate = useNavigate();

  const handlePhaseChange = (phase: string) => {
    navigate(`/projects/${project.id}/updates/new?messageType=phase_change&phase=${phase}`);
  };

  return (
    <div className="flex flex-col">
      <Label title="Phase" />
      <ProjectPhaseSelector activePhase={project.phase} editable={editable} onSelected={handlePhaseChange} />
    </div>
  );
}

function ArrowRight() {
  return <span className="mt-0.5">-&gt;</span>;
}

function Dates() {
  return (
    <div className="flex flex-col">
      <Label title="Timeline" />
      <div className="flex items-center">
        <StartDate />
        <ArrowRight />
        <DueDate />
      </div>
    </div>
  );
}

function StartDate() {
  const { project, refetch, editable } = React.useContext(Context) as ContextDescriptor;

  const [update] = Projects.useSetProjectStartDateMutation({ onCompleted: refetch });

  const change = (date: Date | null) => {
    update({
      variables: {
        projectId: project.id,
        startDate: date ? Time.toDateWithoutTime(date) : null,
      },
    });
  };

  return (
    <div className="flex flex-col">
      <DatePickerWithClear
        editable={editable}
        selected={project.startedAt}
        onChange={change}
        placeholder="Start Date"
      />
    </div>
  );
}

function DueDate() {
  const { project, refetch, editable } = React.useContext(Context) as ContextDescriptor;

  const [update] = Projects.useSetProjectDueDateMutation({ onCompleted: refetch });

  const change = (date: Date | null) => {
    update({
      variables: {
        projectId: project.id,
        dueDate: date ? Time.toDateWithoutTime(date) : null,
      },
    });
  };

  return (
    <div className="flex flex-col">
      <DatePickerWithClear editable={editable} selected={project.deadline} onChange={change} placeholder="Due Date" />
    </div>
  );
}

function DatePickerWithClear({ selected, onChange, editable = true, placeholder }) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = Time.parse(selected);

  const handleChange = (date: Date | null) => {
    if (!editable) return;

    onChange(date);
    setOpen(false);
  };

  return (
    <SelectBox.SelectBox editable={editable} activeValue={selectedDate} open={open} onOpenChange={setOpen}>
      <SelectBox.Trigger className="flex items-center gap-1">
        {selectedDate ? (
          <FormattedTime time={selectedDate} format="short-date" />
        ) : (
          <span className="text-white-1/60">{placeholder}</span>
        )}
      </SelectBox.Trigger>

      <SelectBox.Popup>
        <DatePicker inline selected={selectedDate} onChange={handleChange} className="border-none"></DatePicker>
        <UnsetLink handleChange={handleChange} />
      </SelectBox.Popup>
    </SelectBox.SelectBox>
  );
}

function UnsetLink({ handleChange }) {
  return (
    <a
      className="font-medium text-blue-400/80 hover:text-blue-400 cursor-pointer underline underline-offset-2 mx-2 -mt-1 pb-1 block"
      onClick={() => handleChange(null)}
    >
      Unset
    </a>
  );
}

function Timeline2({ project, refetch }) {
  const startDate = Time.parse(project.startedAt || project.insertedAt);
  if (!startDate) throw new Error("Invalid start date");

  const dueDate = Time.parse(project.deadline || Time.add(startDate, 6, "months"));
  if (!dueDate) throw new Error("Invalid due date");

  const lineStart = Time.closestMonday(startDate, "before");
  const lineEnd = Time.closestMonday(dueDate, "after");

  let markedDates = Time.everyMondayBetween(lineStart, lineEnd);

  while (markedDates.length > 10) {
    markedDates = markedDates.filter((_, index) => index % 2 === 0);
  }

  return (
    <div className="border border-dark-5 rounded-lg shadow-lg bg-dark-3 p-4" data-test-id="timeline">
      <div className="flex items-start gap-4 pb-3 border-b border-dark-5 -mx-4 px-4">
        <Dates />
        <Phase />
        <Health />
      </div>

      <div className="mb-6 pt-20">
        <div className="flex items-center w-full relative">
          <div className="relative w-full">
            <div className="overflow-hidden h-4 flex items-center w-full">
              <ProjectDurationMarker project={project} lineStart={lineStart} lineEnd={lineEnd} />

              {project.phaseHistory.map((phase) => (
                <PhaseMarker
                  key={phase.phase}
                  phase={phase.phase}
                  startedAt={phase.startTime}
                  finishedAt={phase.endTime || Time.today()}
                  lineStart={lineStart}
                  lineEnd={lineEnd}
                />
              ))}
            </div>

            <StartMarker project={project} lineStart={lineStart} lineEnd={lineEnd} />
            <TodayMarker lineStart={lineStart} lineEnd={lineEnd} />
            <EndMarker project={project} lineStart={lineStart} lineEnd={lineEnd} />

            {markedDates.map((date, index) => (
              <DateLabel key={index} date={date} index={index} total={markedDates.length} />
            ))}

            {project.milestones.map((milestone) => (
              <MilestoneMarker key={milestone.id} milestone={milestone} lineStart={lineStart} lineEnd={lineEnd} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 mt-10 border-t border-dark-5 -mx-4 px-4">
        <NextMilestone project={project} refetch={refetch} />
        <div className="text-sm flex items-center gap-1 cursor-pointer font-medium text-white-1/60 hover:text-white-1">
          <Icons.IconArrowDown size={16} stroke={2} />
          Show all milestones
        </div>
      </div>
    </div>
  );
}

function NextMilestone({ project, refetch }) {
  if (project.nextMilestone) {
    return <ExistingNextMilestone project={project} refetch={refetch} />;
  } else {
    return <NoNextMilestones />;
  }
}

function ExistingNextMilestone({ project, refetch }) {
  const isOverdue = Time.parse(project.nextMilestone.deadlineAt) < Time.today();
  const iconColor = isOverdue ? "text-red-400" : "text-yellow-400";
  const label = isOverdue ? "Overdue" : "Next";

  return (
    <div className="flex items-center gap-2">
      <Icons.IconMapPinFilled size={16} className={iconColor} />
      <span>
        {label}: <span className="text-white-1 font-bold">{project.nextMilestone.title}</span>
      </span>

      <CompleteMilestoneButton project={project} milestone={project.nextMilestone} refetch={refetch} />
    </div>
  );
}

function CompleteMilestoneButton({ project, milestone, refetch }) {
  const [{ me }] = Paper.useLoadedData();
  const [complete, { loading }] = Milestones.useSetStatus();

  if (project.champion.id !== me.id) return null;

  const handleComplete = async () => {
    await complete({
      variables: {
        milestoneId: milestone.id,
        status: "done",
      },
    });

    await refetch();
  };

  return (
    <Button
      onClick={handleComplete}
      loading={loading}
      size="tiny"
      variant="secondary"
      data-test-id="complete-milestone"
    >
      Complete
    </Button>
  );
}

function NoNextMilestones() {
  return (
    <div className="flex items-center gap-2">
      <Icons.IconMapPinFilled size={16} className="text-white-1/60" />
      <span className="text-white-1/60">No upcoming milestones</span>
    </div>
  );
}

function ProjectDurationMarker({ project, lineStart, lineEnd }) {
  const start = Time.parse(project.startedAt || lineStart);
  const end = Time.parse(project.deadline || lineEnd);

  if (!start || !end) return null;

  const left = `${(Time.daysBetween(lineStart, start) / Time.daysBetween(lineStart, lineEnd)) * 100}%`;
  const width = `${(Time.daysBetween(start, end) / Time.daysBetween(lineStart, lineEnd)) * 100}%`;

  return <div className="bg-shade-1 h-4 relative" style={{ left, width }}></div>;
}

function PhaseMarker({ phase, startedAt, finishedAt, lineStart, lineEnd }) {
  if (phase === "paused") return null;
  if (phase === "completed") return null;
  if (phase === "canceled") return null;

  const start = Time.parse(startedAt) || Time.today();
  const end = Time.parse(finishedAt) || Time.today();

  const left = `${(Time.daysBetween(lineStart, start) / Time.daysBetween(lineStart, lineEnd)) * 100}%`;
  const width = `${(Time.daysBetween(start, end) / Time.daysBetween(lineStart, lineEnd)) * 100}%`;

  let colorClass = "bg-green-400";
  switch (phase) {
    case "planning":
      colorClass = "bg-gray-400";
      break;
    case "execution":
      colorClass = "bg-yellow-400";
      break;
    case "control":
      colorClass = "bg-green-400";
      break;
    default:
      throw new Error("Invalid phase " + phase);
  }

  const className = `h-4 absolute ${colorClass}`;

  return (
    <div className={className} style={{ left: "calc(" + left + " + 1px)", width: "calc(" + width + " - 2px)" }}></div>
  );
}

function EndMarker({ project, lineStart, lineEnd }) {
  const date = Time.parse(project.deadline);
  if (!date) return null;

  const left = `${(Time.daysBetween(lineStart, date) / Time.daysBetween(lineStart, lineEnd)) * 100}%`;

  return <div className="bg-white-1 absolute -top-1 -bottom-1" style={{ left: left, width: "2px" }}></div>;
}

function StartMarker({ project, lineStart, lineEnd }) {
  const date = Time.parse(project.startedAt || project.insertedAt);
  if (!date) return null;

  const left = `${(Time.daysBetween(lineStart, date) / Time.daysBetween(lineStart, lineEnd)) * 100}%`;

  return <div className="bg-white-1 absolute -top-1 -bottom-1" style={{ left: left, width: "2px" }}></div>;
}

function TodayMarker({ lineStart, lineEnd }) {
  const today = Time.today();
  const left = `${(Time.daysBetween(lineStart, today) / Time.daysBetween(lineStart, lineEnd)) * 100}%`;

  return <div className="bg-indigo-400 absolute -top-1 -bottom-1" style={{ left: left, width: "2px" }}></div>;
}

function MilestoneMarker({ milestone, lineStart, lineEnd }) {
  const today = Time.today();
  const date = Time.parse(milestone.deadlineAt);
  if (!date) return null;
  if (date < lineStart) return null;
  if (date > lineEnd) return null;

  const left = `${(Time.daysBetween(lineStart, date) / Time.daysBetween(lineStart, lineEnd)) * 100}%`;
  const isOverdue = date < today;

  let color = "";

  if (milestone.status === "done") {
    color = "text-green-400";
  } else if (isOverdue) {
    color = "text-red-400";
  } else {
    color = "text-white-1/60";
  }

  return (
    <div className="absolute flex flex-col items-center gap-1 pt-0.5" style={{ left: left, top: "-32px" }}>
      <Icons.IconMapPinFilled size={16} className={color} />
      <div className="h-1.5 bg-dark-8" style={{ width: "2px" }}></div>
    </div>
  );
}

function DateLabel({ date, index, total }) {
  const left = `${(index / total) * 100}%`;
  const width = `${100 / total}%`;
  const title = <FormattedTime time={date} format="short-date" />;

  return (
    <div
      className="absolute flex items-start gap-1 break-keep border-x border-shade-1"
      style={{ left: left, top: "-60px", width: width, height: "100px" }}
    >
      <span className="text-xs text-white-2 whitespace-nowrap pl-2">{title}</span>
    </div>
  );
}
