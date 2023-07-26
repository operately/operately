import React from "react";

import { useNavigate } from "react-router-dom";

import DatePicker from "react-datepicker";
import FormattedTime from "@/components/FormattedTime";

import * as Projects from "@/graphql/Projects";
import * as Time from "@/utils/time";
import * as Popover from "@radix-ui/react-popover";
import * as Icons from "@tabler/icons-react";

import * as ProjectIcons from "@/components/ProjectIcons";

export default function Timeline({ me, project, refetch }) {
  return (
    <div className="flex items-center gap-8 mb-4">
      <Phase me={me} project={project} refetch={refetch} />
      <StartDate me={me} project={project} refetch={refetch} />
      <DueDate me={me} project={project} refetch={refetch} />
    </div>
  );
}

function Phase({ me, project, refetch }) {
  // const [update] = Projects.useSetProjectPhaseMutation({ onCompleted: refetch });
  const [update] = [({}) => {}];

  const change = (event: React.ChangeEvent<HTMLSelectElement>) => {
    update({
      variables: {
        projectId: project.id,
        phase: event.target.value,
      },
    });
  };

  return (
    <div className="flex flex-col">
      <div className="font-bold">Phase</div>
      <PhasePopover editable={project.champion.id === me.id} project={project} />
    </div>
  );
}

function PhasePopover({ project, editable }) {
  if (!editable) {
    return <div className="font-medium text-white-2/80 capitalize">{project.phase}</div>;
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <a className="font-medium text-blue-400 hover:text-blue-400 cursor-pointer underline underline-offset-2 capitalize">
          {project.phase}
        </a>
      </Popover.Trigger>

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

function PhasePopoverOption({ phase, project }) {
  const navigate = useNavigate();
  const active = project.phase === phase;

  const onClick = () => {
    if (active) return;

    navigate(`/projects/${project.id}/updates/new?phase=${phase}`);
  };

  return (
    <div
      className="flex items-center justify-between gap-8 hover:bg-shade-1 cursor-pointer px-2 py-1 rounded text-sm font-medium"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <ProjectIcons.IconForPhase phase={phase} />
        <span className="capitalize">{phase}</span>
      </div>
      {active && <Icons.IconCheck size={16} className="text-white-1" />}
    </div>
  );
}

function StartDate({ me, project, refetch }) {
  const startDate = project.startedAt ? Time.parseDateWithoutTime(project.startedAt) : null;

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
      <div className="font-bold">Start Date</div>
      <DatePickerWithClear editable={project.champion.id === me.id} selected={startDate} onChange={change} />
    </div>
  );
}

function DueDate({ me, project, refetch }) {
  const dueDate = project.deadline ? Time.parseDateWithoutTime(project.deadline) : null;

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
      <div className="font-bold">Due Date</div>
      <DatePickerWithClear editable={project.champion.id === me.id} selected={dueDate} onChange={change} />
    </div>
  );
}

function DatePickerWithClear({ selected, onChange, editable = true }) {
  const [open, setOpen] = React.useState(false);

  const handleChange = (date: Date | null) => {
    if (!editable) return;

    onChange(date);
    setOpen(false);
  };

  let value: React.ReactNode = null;

  if (editable) {
    if (selected) {
      value = (
        <a className="font-medium text-blue-400 hover:text-blue-400 cursor-pointer underline underline-offset-2">
          <FormattedTime time={selected} format="long-date" />
        </a>
      );
    } else {
      value = (
        <a className="font-medium text-blue-400/80 hover:text-blue-400 cursor-pointer underline underline-offset-2">
          Select Date...
        </a>
      );
    }
  } else {
    if (selected) {
      value = <FormattedTime time={selected} format="long-date" />;
    } else {
      value = <span className="text-white-2">Not set</span>;
    }
  }

  return (
    <DatePicker
      open={open}
      selected={selected}
      onChange={handleChange}
      onInputClick={() => setOpen(true)}
      customInput={value}
    >
      <a
        className="font-medium text-blue-400/80 hover:text-blue-400 cursor-pointer underline underline-offset-2 text-sm"
        onClick={() => handleChange(null)}
      >
        Unset
      </a>
    </DatePicker>
  );
}
