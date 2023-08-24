import React from "react";

import { useNavigate } from "react-router-dom";

import FormattedTime from "@/components/FormattedTime";
import DatePicker from "react-datepicker";

import * as SelectBox from "@/components/SilentSelectBox";
import * as Projects from "@/graphql/Projects";
import * as Time from "@/utils/time";
import * as Icons from "@tabler/icons-react";

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
      <Timeline2 project={project} />
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

function Timeline2({ project }) {
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
    <div className="border border-dark-5 rounded-lg shadow-lg bg-dark-3 p-4">
      <div className="flex items-start gap-4 pb-3 border-b border-dark-5 -mx-4 px-4">
        <Dates />
        <Phase />
        <Health />
      </div>

      <div className="mb-6 pt-20">
        <div className="flex items-center w-full relative">
          <div className="relative w-full">
            <div className="overflow-hidden h-4 flex items-center w-full">
              <div className="w-1/3 flex items-center gap-0.5">
                <div className="w-1/12 bg-yellow-400 h-4"></div>
                <div className="w-11/12 bg-blue-400 h-4 text-dark-3 font-semibold flex items-center"></div>
              </div>

              <div className="w-2/3 bg-shade-1 h-4 text-sm flex items-center justify-end text-white-2"></div>
            </div>

            {markedDates.map((date, index) => (
              <DateLabel key={index} date={date} index={index} total={markedDates.length} />
            ))}
          </div>

          <div className="bg-blue-100 absolute top-0 bottom-0 left-1/3 w-1"></div>

          {project.milestones.map((milestone) => (
            <MilestoneMarker key={milestone.id} milestone={milestone} lineStart={lineStart} lineEnd={lineEnd} />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 mt-10 border-t border-dark-5 -mx-4 px-4">
        <div className="flex items-center gap-2">
          <Icons.IconMapPinFilled size={16} className="text-yellow-400" />
          {project.nextMilestone?.title ? (
            <span>
              Next: <span className="text-white-1 font-bold">{project.nextMilestone?.title}</span>
            </span>
          ) : (
            <span className="text-white-1/60 mt-1">No upcoming milestones</span>
          )}
        </div>

        <div className="text-sm flex items-center gap-1 cursor-pointer font-medium text-white-1/60 hover:text-white-1">
          <Icons.IconArrowDown size={16} stroke={2} />
          Show all milestones
        </div>
      </div>
    </div>
  );
}

function MilestoneMarker({ milestone, lineStart, lineEnd }) {
  const date = Time.parse(milestone.deadlineAt);
  if (!date) return null;

  const left = `${(Time.daysBetween(lineStart, date) / Time.daysBetween(lineStart, lineEnd)) * 100}%`;

  return (
    <div className="absolute flex flex-col items-center gap-1 pt-0.5" style={{ left: left, top: "-32px" }}>
      <Icons.IconMapPinFilled size={16} className="text-white-2" />
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
