import React from "react";

import { useNavigate } from "react-router-dom";

import FormattedTime from "@/components/FormattedTime";
import DatePicker from "react-datepicker";

import * as SelectBox from "@/components/SilentSelectBox";
import * as Projects from "@/graphql/Projects";
import * as Time from "@/utils/time";

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
      <div className="flex items-start gap-4 mb-4">
        <Phase />
        <Dates />
        <Health />
      </div>
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
