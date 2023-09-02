import React from "react";

import { useNavigate } from "react-router-dom";
import { useBoolState } from "@/utils/useBoolState";

import FormattedTime from "@/components/FormattedTime";
import DatePicker from "react-datepicker";

import * as SelectBox from "@/components/SilentSelectBox";
import * as Projects from "@/graphql/Projects";
import * as Time from "@/utils/time";
import * as Icons from "@tabler/icons-react";
import * as Milestones from "@/graphql/Projects/milestones";

import Button from "@/components/Button";
import ProjectHealthSelector from "@/components/ProjectHealthSelector";
import ProjectPhaseSelector from "@/components/ProjectPhaseSelector";
import { TextTooltip } from "@/components/Tooltip";

interface ContextDescriptor {
  project: Projects.Project;
  refetch: () => void;
  editable: boolean;
}

const Context = React.createContext<ContextDescriptor | null>(null);

export default function Timeline({ project, refetch, editable }) {
  return (
    <Context.Provider value={{ project, refetch, editable }}>
      <div className="border border-dark-8 rounded-lg shadow-lg bg-dark-3" data-test-id="timeline">
        <div className="flex items-start gap-4 pb-3 border-b border-dark-8 p-4">
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
  const milestones = Milestones.sortByDeadline(project.milestones);
  const firstMilestone = Time.parse(milestones[0]?.deadlineAt || null);
  const lastMilestone = Time.parse(milestones[milestones.length - 1]?.deadlineAt || null);
  const projectStart = Time.parse(project.startedAt || project.insertedAt) || Time.today();
  const projectEnd = Time.parse(project.deadline || Time.add(projectStart, 6, "months"));

  const startDate = Time.earliest(projectStart, firstMilestone);
  if (!startDate) throw new Error("Invalid start date");

  const dueDate = Time.latest(projectEnd, lastMilestone);
  if (!dueDate) throw new Error("Invalid due date");

  const lineStart = Time.closestMonday(startDate, "before");
  const lineEnd = Time.closestMonday(dueDate, "after");

  let markedDates = Time.everyMondayBetween(lineStart, lineEnd);

  while (markedDates.length > 10) {
    markedDates = markedDates.filter((_, index) => index % 2 === 0);
  }

  return (
    <div className="">
      <div className="flex items-center w-full relative" style={{ height: "150px" }}>
        {markedDates.map((date, index) => (
          <DateLabel key={index} date={date} index={index} total={markedDates.length} />
        ))}

        <div className="absolute" style={{ top: "90px", bottom: "40px", left: 0, right: 0 }}>
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

          {project.milestones.map((milestone: Milestones.Milestone) => (
            <MilestoneMarker key={milestone.id} milestone={milestone} lineStart={lineStart} lineEnd={lineEnd} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MilestoneList({ project, refetch }) {
  const [expanded, _, expand, collapse] = useBoolState(true);

  return (
    <div className="border-t border-dark-8 py-3">
      {expanded ? (
        <MilestoneListExpanded project={project} refetch={refetch} onCollapse={collapse} />
      ) : (
        <MilestoneListCollapsed project={project} refetch={refetch} onExpand={expand} />
      )}
    </div>
  );
}

function MilestoneListCollapsed({ project, refetch, onExpand }) {
  return (
    <div className="flex items-center justify-between px-4">
      <NextMilestone project={project} refetch={refetch} />
      <div
        className="flex items-center gap-1 cursor-pointer font-medium text-white-1/60 hover:text-white-1"
        onClick={onExpand}
        data-test-id="show-all-milestones"
      >
        <Icons.IconArrowDown size={16} stroke={2} />
        Show all milestones
      </div>
    </div>
  );
}

function MilestoneListExpanded({ project, onCollapse, refetch }) {
  const milestones = Milestones.sortByDeadline(project.milestones, { reverse: false });

  return (
    <div className="">
      <div className="flex items-center border-b border-dark-5 pb-2 px-4">
        <div className="font-semibold flex-1">Milestone</div>
        <div className="font-semibold w-32 pl-1">Due On</div>
        <div className="font-semibold w-32">Completed</div>
        <div className="font-semibold w-16"></div>
      </div>

      {milestones.map((milestone: Milestones.Milestone) => (
        <MilestoneListItem key={milestone.id} milestone={milestone} project={project} refetch={refetch} />
      ))}

      <MilestoneAdd project={project} refetch={refetch} />

      <div className="flex items-center justify-between -mb-3">
        <div></div>

        <div
          className="flex items-center gap-1 cursor-pointer font-medium text-white-1/60 hover:text-white-1 px-4 py-3"
          onClick={onCollapse}
        >
          <Icons.IconArrowUp size={16} stroke={2} />
          Collapse
        </div>
      </div>
    </div>
  );
}

function MilestoneAdd({ project, refetch }) {
  const [active, _, activate, deactivate] = useBoolState(false);

  if (!project.permissions.canCreateMilestone) return null;

  if (active) {
    return <MilestoneAddActive project={project} refetch={refetch} deactivate={deactivate} />;
  } else {
    return <MilestoneAddNotActive activate={activate} />;
  }
}

function MilestoneAddNotActive({ activate }) {
  return (
    <div
      className="flex items-center border-b border-dark-5 py-3 group hover:bg-shade-1 px-4 cursor-pointer"
      onClick={activate}
    >
      <div className="flex items-center gap-2 flex-1 truncate">
        <Icons.IconPlus size={16} className={"text-white-1/60"} /> Add Milestone
      </div>
    </div>
  );
}

function MilestoneAddActive({ project, refetch, deactivate }) {
  const [name, setName] = React.useState("");
  const [dueDate, setDueDate] = React.useState<Date | null>(null);
  const [add, { loading }] = Milestones.useAddMilestone();

  const handleSubmit = async () => {
    if (!name || !dueDate) return;

    await add({
      variables: {
        projectId: project.id,
        title: name,
        deadlineAt: Time.toDateWithoutTime(dueDate),
      },
    });

    await deactivate();
    await refetch();
  };

  const handleCancel = () => {
    deactivate();
  };

  const valid = name.length > 0 && dueDate !== null;

  return (
    <div className="flex items-center border-b border-dark-5 py-2 cursor-pointer px-4">
      <div className="flex items-center gap-2 flex-1 truncate">
        <Icons.IconMapPinFilled size={16} className={"text-white-1/60"} />

        <input
          className="flex-1 bg-transparent outline-none placeholder:text-white-1/60"
          placeholder="e.g. Design Review"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="w-32 flex items-center">
        <DatePickerWithClear
          editable={true}
          selected={dueDate}
          onChange={setDueDate}
          clearable={false}
          placeholder="Due Date"
        />
      </div>

      <div className="w-48 flex items-center gap-2 flex-row-reverse">
        <Button onClick={handleCancel} size="tiny" variant="secondary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} size="tiny" variant="default" disabled={!valid} loading={loading}>
          Save
        </Button>
      </div>
    </div>
  );
}

function MilestoneListItem({ milestone, project, refetch }) {
  const iconColor = milestoneIconColor(milestone);

  return (
    <div className="flex items-center border-b border-dark-5 py-2 group hover:bg-shade-1 px-4">
      <div className="flex items-center gap-2 flex-1 truncate">
        <div className="shink-0">
          <Icons.IconMapPinFilled size={16} className={iconColor} />
        </div>

        {milestone.title}
      </div>

      <MilestoneListItemDueDate milestone={milestone} refetch={refetch} />

      <div className="w-32">
        {milestone.completedAt && <FormattedTime time={milestone.completedAt} format="short-date" />}
      </div>

      <div className="w-16 flex-row-reverse flex items-center gap-2">
        <RemoveMilestoneButton project={project} milestone={milestone} refetch={refetch} />

        {milestone.status !== "done" && (
          <CompleteMilestoneButton project={project} milestone={project.nextMilestone} refetch={refetch} />
        )}
      </div>
    </div>
  );
}

function RemoveMilestoneButton({ project, milestone, refetch }) {
  const [remove] = Milestones.useRemoveMilestone();

  if (!project.permissions.canDeleteMilestone) return null;

  const handleRemove = async () => {
    await remove({
      variables: {
        milestoneId: milestone.id,
      },
    });

    await refetch();
  };

  return (
    <TextTooltip text="Mark as completed" delayDuration={600}>
      <div
        className="shrink-0 p-1.5 bg-shade-1 rounded hover:bg-red-400/20 hover:text-red-400 text-white-1/60 cursor-pointer transition-colors"
        onClick={handleRemove}
      >
        <Icons.IconTrash size={16} />
      </div>
    </TextTooltip>
  );
}

function MilestoneListItemDueDate({ milestone, refetch }) {
  const editable = milestone.status !== "done";
  const [update] = Milestones.useSetDeadline();

  const change = async (date: Date | null) => {
    await update({
      variables: {
        milestoneId: milestone.id,
        deadlineAt: date ? Time.toDateWithoutTime(date) : null,
      },
    });

    refetch();
  };

  return (
    <div className="w-32 flex items-center gap-2 cursor-pointer -mt-1" data-test-id="change-milestone-due-date">
      <DatePickerWithClear editable={editable} selected={milestone.deadlineAt} onChange={change} clearable={false}>
        <FormattedTime time={milestone.deadlineAt} format="short-date" />
        {editable && (
          <div className="opacity-0 group-hover:opacity-100">
            <Icons.IconCalendarCog size={16} className="text-white-1/60" />
          </div>
        )}
      </DatePickerWithClear>
    </div>
  );
}

function Label({ title }) {
  return <div className="font-bold ml-1">{title}</div>;
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

function DatePickerWithClear({
  selected,
  onChange,
  editable = true,
  placeholder,
  children = null,
  clearable = true,
}: any) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = Time.parse(selected);

  const handleChange = (date: Date | null) => {
    if (!editable) return;

    onChange(date);
    setOpen(false);
  };

  let trigger: JSX.Element | null = null;

  if (children) {
    trigger = <SelectBox.Trigger className="flex items-center gap-1">{children}</SelectBox.Trigger>;
  } else {
    trigger = (
      <SelectBox.Trigger className="flex items-center gap-1">
        {selectedDate ? (
          <FormattedTime time={selectedDate} format="short-date" />
        ) : (
          <span className="text-white-1/60">{placeholder}</span>
        )}
      </SelectBox.Trigger>
    );
  }

  return (
    <SelectBox.SelectBox editable={editable} activeValue={selectedDate} open={open} onOpenChange={setOpen}>
      {trigger}

      <SelectBox.Popup>
        <DatePicker inline selected={selectedDate} onChange={handleChange} className="border-none"></DatePicker>
        {clearable && <UnsetLink handleChange={handleChange} />}
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

function milestoneIconColor(milestone: Milestones.Milestone) {
  const deadline = Time.parse(milestone.deadlineAt);

  if (milestone.status === "done") return "text-green-400";
  if (!deadline) return "text-white-1/60";

  const isOverdue = deadline < Time.today();

  return isOverdue ? "text-red-400" : "text-white-1/60";
}

function ExistingNextMilestone({ project, refetch }) {
  const isOverdue = Time.parse(project.nextMilestone.deadlineAt) < Time.today();
  const iconColor = milestoneIconColor(project.nextMilestone);
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

function CompleteMilestoneButton({
  project,
  milestone,
  refetch,
}: {
  project: Projects.Project;
  milestone: any;
  refetch: () => void;
}) {
  const [complete] = Milestones.useSetStatus();

  if (!project.permissions.canEditMilestone) return null;

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
    <TextTooltip text="Mark as completed" delayDuration={600}>
      <div className="shrink-0 p-1.5 bg-shade-1 rounded hover:bg-green-400/20 hover:text-green-400 text-white-1/60 cursor-pointer transition-colors">
        <Icons.IconCheck size={16} onClick={handleComplete} />
      </div>
    </TextTooltip>
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
  const color = milestoneIconColor(milestone);

  return (
    <div
      className="absolute flex flex-col items-center justify-normal gap-1 pt-0.5"
      style={{ left: left, top: "-35px", width: "0px" }}
    >
      <Icons.IconMapPinFilled size={20} className={color} />
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
      style={{ left: left, top: 0, bottom: 0, width: width, height: "150px" }}
    >
      <span className="text-sm text-white-2 whitespace-nowrap pl-2 pt-2">{title}</span>
    </div>
  );
}
