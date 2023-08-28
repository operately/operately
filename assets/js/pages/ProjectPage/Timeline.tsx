import React from "react";

import { useNavigate } from "react-router-dom";
import { useBoolState } from "@/utils/useBoolState";

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
      <div className="border border-dark-5 rounded-lg shadow-lg bg-dark-3" data-test-id="timeline">
        <div className="flex items-start gap-4 pb-3 border-b border-dark-5 p-4">
          <Dates />
          <Phase />
          <Health />
        </div>

        <Calendar project={project} />
        <MilestoneList project={project} refetch={refetch} />
      </div>
    </Context.Provider>
  );
}

function Calendar({ project }) {
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
    <div className="p-4">
      <div className="flex items-center w-full relative" style={{ height: "100px" }}>
        {markedDates.map((date, index) => (
          <DateLabel key={index} date={date} index={index} total={markedDates.length} />
        ))}

        <div className="absolute" style={{ top: "60px", bottom: "25px", left: 0, right: 0 }}>
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

          <StartMarker project={project} lineStart={lineStart} lineEnd={lineEnd} />
          <TodayMarker lineStart={lineStart} lineEnd={lineEnd} />
          <EndMarker project={project} lineStart={lineStart} lineEnd={lineEnd} />

          {project.milestones.map((milestone) => (
            <MilestoneMarker key={milestone.id} milestone={milestone} lineStart={lineStart} lineEnd={lineEnd} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MilestoneList({ project, refetch }) {
  const [expanded, _, expand, collapse] = useBoolState(false);

  return (
    <div className="border-t border-dark-5 px-4 py-3">
      {expanded ? (
        <MilestoneListExpanded project={project} onCollapse={collapse} />
      ) : (
        <MilestoneListCollapsed project={project} refetch={refetch} onExpand={expand} />
      )}
    </div>
  );
}

function MilestoneListCollapsed({ project, refetch, onExpand }) {
  return (
    <div className="flex items-center justify-between">
      <NextMilestone project={project} refetch={refetch} />
      <div
        className="text-sm flex items-center gap-1 cursor-pointer font-medium text-white-1/60 hover:text-white-1"
        onClick={onExpand}
        data-test-id="show-all-milestones"
      >
        <Icons.IconArrowDown size={16} stroke={2} />
        Show all milestones
      </div>
    </div>
  );
}

function MilestoneListExpanded({ project, onCollapse }) {
  const milestones = Milestones.sortByDeadline(project.milestones, { reverse: true });

  return (
    <div className="">
      <div className="flex items-center border-b border-dark-5 pb-2">
        <div className="font-semibold text-sm flex-1">Milestone</div>
        <div className="font-semibold text-sm w-32">Due Date</div>
        <div className="font-semibold text-sm w-32">Completed On</div>
      </div>

      {milestones.map((milestone: Milestones.Milestone) => (
        <MilstoneListItem key={milestone.id} milestone={milestone} />
      ))}

      <div className="flex items-center justify-between -mb-3 -mx-4">
        <div></div>

        <div
          className="text-sm flex items-center gap-1 cursor-pointer font-medium text-white-1/60 hover:text-white-1 px-4 py-3"
          onClick={onCollapse}
        >
          <Icons.IconArrowUp size={16} stroke={2} />
          Collapse
        </div>
      </div>
    </div>
  );
}

function MilstoneListItem({ milestone }) {
  const iconColor = milestonIconColor(milestone);

  return (
    <div className="flex items-center text-sm border-b border-dark-5 py-2" key={milestone.id}>
      <div className="flex items-center gap-2 flex-1 truncate">
        <Icons.IconMapPinFilled size={16} className={iconColor} /> {milestone.title}
      </div>

      <div className="w-32">
        <FormattedTime time={milestone.deadlineAt} format="short-date" />
      </div>

      <div className="w-32"></div>
    </div>
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

function NextMilestone({ project, refetch }) {
  if (project.nextMilestone) {
    return <ExistingNextMilestone project={project} refetch={refetch} />;
  } else {
    return <NoNextMilestones />;
  }
}

function milestonIconColor(milestone: Milestones.Milestone) {
  const deadline = Time.parse(milestone.deadlineAt);

  if (milestone.status === "done") return "text-green-400";
  if (!deadline) return "text-white-1/60";

  const isOverdue = deadline < Time.today();

  return isOverdue ? "text-red-400" : "text-white-1/60";
}

function ExistingNextMilestone({ project, refetch }) {
  const isOverdue = Time.parse(project.nextMilestone.deadlineAt) < Time.today();
  const iconColor = milestonIconColor(project.nextMilestone);
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

function PhaseMarker({ phase, startedAt, finishedAt, lineStart, lineEnd }) {
  if (phase === "paused") return null;
  if (phase === "completed") return null;
  if (phase === "canceled") return null;

  const start = Time.parse(startedAt) || Time.today();
  const end = Time.parse(finishedAt) || Time.today();

  const left = `${(Time.secondsBetween(lineStart, start) / Time.secondsBetween(lineStart, lineEnd)) * 100}%`;
  const width = `${(Time.secondsBetween(start, end) / Time.secondsBetween(lineStart, lineEnd)) * 100}%`;

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

  return (
    <div
      className={`absolute ${colorClass}`}
      style={{
        left: "calc(" + left + " + 1px)",
        width: "calc(" + width + " - 2px)",
        top: 0,
        bottom: 0,
      }}
    ></div>
  );
}

function ProjectDurationMarker({ project, lineStart, lineEnd }) {
  const start = Time.parse(project.startedAt || lineStart);
  const end = Time.parse(project.deadline || lineEnd);

  if (!start || !end) return null;

  const left = `${(Time.secondsBetween(lineStart, start) / Time.secondsBetween(lineStart, lineEnd)) * 100}%`;
  const width = `${(Time.secondsBetween(start, end) / Time.secondsBetween(lineStart, lineEnd)) * 100}%`;

  return <div className="bg-shade-1 absolute" style={{ left, width, top: 0, bottom: 0 }}></div>;
}

function EndMarker({ project, lineStart, lineEnd }) {
  const date = Time.parse(project.deadline);
  if (!date) return null;

  const left = `${(Time.secondsBetween(lineStart, date) / Time.secondsBetween(lineStart, lineEnd)) * 100}%`;

  return <div className="bg-white-1 absolute -top-1 -bottom-1" style={{ left: left, width: "2px" }}></div>;
}

function StartMarker({ project, lineStart, lineEnd }) {
  const date = Time.parse(project.startedAt || project.insertedAt);
  if (!date) return null;

  const left = `${(Time.secondsBetween(lineStart, date) / Time.secondsBetween(lineStart, lineEnd)) * 100}%`;

  return <div className="bg-white-1 absolute -top-1 -bottom-1" style={{ left: left, width: "2px" }}></div>;
}

function TodayMarker({ lineStart, lineEnd }) {
  const today = Time.today();
  const left = `${(Time.secondsBetween(lineStart, today) / Time.secondsBetween(lineStart, lineEnd)) * 100}%`;

  return <div className="bg-indigo-400 absolute -top-1 -bottom-1" style={{ left: left, width: "2px" }}></div>;
}

function MilestoneMarker({ milestone, lineStart, lineEnd }) {
  const date = Time.parse(milestone.deadlineAt);
  if (!date) return null;
  if (date < lineStart) return null;
  if (date > lineEnd) return null;

  const left = `${(Time.secondsBetween(lineStart, date) / Time.secondsBetween(lineStart, lineEnd)) * 100}%`;
  const color = milestonIconColor(milestone);

  return (
    <div
      className="absolute flex flex-col items-center justify-normal gap-1 pt-0.5"
      style={{ left: left, top: "-32px", width: "0px" }}
    >
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
      style={{ left: left, top: 0, bottom: 0, width: width, height: "100px" }}
    >
      <span className="text-xs text-white-2 whitespace-nowrap pl-2">{title}</span>
    </div>
  );
}
