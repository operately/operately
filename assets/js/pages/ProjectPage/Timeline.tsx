import React from "react";

import classnames from "classnames";

import { useNavigate } from "react-router-dom";

import DatePicker from "react-datepicker";
import FormattedTime from "@/components/FormattedTime";

import * as Projects from "@/graphql/Projects";
import * as Time from "@/utils/time";
import * as Popover from "@radix-ui/react-popover";
import * as Icons from "@tabler/icons-react";

import * as ProjectIcons from "@/components/ProjectIcons";

interface ContextDescriptor {
  project: Projects.Project;
  refetch: () => void;
  editable: boolean;
}

const Context = React.createContext<ContextDescriptor | null>(null);

export default function Timeline({ me, project, refetch }) {
  const editable = project.champion.id === me.id;

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
  return (
    <div className="flex flex-col">
      <Label title="Health" />
      <HealthPopover />
    </div>
  );
}

function Phase() {
  return (
    <div className="flex flex-col">
      <Label title="Phase" />
      <PhasePopover />
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

function SelectBox({ children, editable }) {
  return (
    <div
      className={classnames({
        "flex items-center gap-2 rounded px-1.5 py-0.5 mt-1": true,
        "cursor-pointer": editable,
        "hover:shadow hover:bg-white-1/[3%]": editable,
      })}
    >
      {children}
    </div>
  );
}

function HealthTitle({ health }) {
  switch (health) {
    case "on_track":
      return <>On-Track</>;
    case "at_risk":
      return <>At Risk</>;
    case "off_track":
      return <>Off-Track</>;
    case "unknown":
      return <span className="text-white-1/60">Unknown</span>;
    default:
      throw new Error(`Unknown health: ${health}`);
  }
}

function HealthPopover() {
  const { project, editable } = React.useContext(Context);

  const label = (
    <SelectBox editable={editable}>
      <div className="flex items-center gap-1 -ml-1">
        <ProjectIcons.IconForHealth health={project.health} />
        <HealthTitle health={project.health} />
      </div>
    </SelectBox>
  );

  if (!editable) {
    return label;
  }

  return (
    <Popover.Root>
      <Popover.Trigger>{label}</Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="outline-none">
          <div className="p-1 bg-dark-3 rounded-lg shadow-lg border border-dark-5 mt-2">
            <div className="font-bold text-sm px-2 py-1 mr-4">Change project health</div>

            <div className="border-t border-white-2/5 my-1" />

            <HealthPopoverOption title="On-Track" health="on_track" project={project} />
            <HealthPopoverOption title="At Risk" health="at_risk" project={project} />
            <HealthPopoverOption title="Off-Track" health="off_track" project={project} />

            <div className="border-t border-white-2/5 my-1" />

            <HealthPopoverOption title="Unknown" health="unknown" project={project} />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function PhasePopover() {
  const { project, editable } = React.useContext(Context);

  const label = (
    <SelectBox editable={editable}>
      <ProjectIcons.IconForPhase phase={project.phase} />
      <span className="capitalize font-medium text-white-1/80">{project.phase}</span>
    </SelectBox>
  );

  if (!editable) {
    return label;
  }

  return (
    <Popover.Root>
      <Popover.Trigger>{label}</Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="outline-none">
          <div className="p-1 bg-dark-3 rounded-lg shadow-lg border border-dark-5 mt-2">
            <div className="font-bold text-sm px-2 py-1 mr-4">Change project phase</div>

            <div className="border-t border-white-2/5 my-1" />

            <PhasePopoverOption phase="paused" project={project} />

            <div className="border-t border-white-2/5 my-1" />

            <PhasePopoverOption phase="planning" project={project} />
            <PhasePopoverOption phase="execution" project={project} />
            <PhasePopoverOption phase="control" project={project} />

            <div className="border-t border-white-2/5 my-1" />

            <PhasePopoverOption phase="completed" project={project} />
            <PhasePopoverOption phase="canceled" project={project} />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function SelectBoxOption({ children, onClick, active }) {
  return (
    <div
      className="flex justify-between items-center rounded px-1.5 py-0.5 mt-1 hover:bg-white-1/[3%] cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">{children}</div>

      {active && <Icons.IconCheck size={16} className="text-white-1" />}
    </div>
  );
}

function PhasePopoverOption({ phase, project }) {
  const navigate = useNavigate();
  const active = project.phase === phase;

  const onClick = () => {
    if (active) return;

    navigate(`/projects/${project.id}/updates/new?phase=${phase}`);
  };

  return (
    <SelectBoxOption onClick={onClick} active={active}>
      <ProjectIcons.IconForPhase phase={phase} />
      <span className="capitalize">{phase}</span>
    </SelectBoxOption>
  );
}

function HealthPopoverOption({ health, title, project }) {
  const navigate = useNavigate();
  const active = project.health === health;

  const onClick = () => {
    if (active) return;

    navigate(`/projects/${project.id}/updates/new?health=${health}`);
  };

  return (
    <SelectBoxOption onClick={onClick} active={active}>
      <ProjectIcons.IconForHealth health={health} />
      <span className="capitalize">{title}</span>
    </SelectBoxOption>
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

  let value = (
    <SelectBox editable={editable}>
      {selectedDate ? (
        <FormattedTime time={selectedDate} format="short-date" />
      ) : (
        <span className="text-white-1/60">{placeholder}</span>
      )}
    </SelectBox>
  );

  if (!editable) {
    return value;
  }

  return (
    <Popover.Root open={open} onOpenChange={(state) => setOpen(state)}>
      <Popover.Trigger>{value}</Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="outline-none">
          <div className="p-1 bg-dark-3 rounded-lg shadow-lg border border-dark-5 mt-2">
            <DatePicker
              inline
              selected={selectedDate}
              onChange={handleChange}
              onInputClick={() => setOpen(true)}
              className="border-none"
              customInput={value}
            ></DatePicker>

            <a
              className="font-medium text-blue-400/80 hover:text-blue-400 cursor-pointer underline underline-offset-2 mx-2 -mt-1 pb-1 block"
              onClick={() => handleChange(null)}
            >
              Unset
            </a>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
