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

export default function Timeline({ me, project, refetch }) {
  return (
    <div className="flex items-start gap-4 mb-4">
      <Phase me={me} project={project} />
      <Dates me={me} project={project} refetch={refetch} />
      <Health me={me} project={project} />
    </div>
  );
}

function Health({ me, project }) {
  return (
    <div className="flex flex-col">
      <div className="font-bold text-sm ml-1">Health</div>
      <HealthPopover editable={project.champion.id === me.id} project={project} />
    </div>
  );
}

function Phase({ me, project }) {
  return (
    <div className="flex flex-col">
      <div className="font-bold text-sm ml-1">Phase</div>
      <PhasePopover editable={project.champion.id === me.id} project={project} />
    </div>
  );
}

function Dates({ me, project, refetch }) {
  return (
    <div className="flex flex-col">
      <div className="font-bold text-sm ml-1">Timeline</div>
      <div className="flex items-center">
        <StartDate me={me} project={project} refetch={refetch} />
        <span className="mt-0.5">-&gt;</span>
        <DueDate me={me} project={project} refetch={refetch} />
      </div>
    </div>
  );
}

function SelectBox({ children, editable }) {
  return (
    <div
      className={classnames({
        "flex items-center gap-2 cursor-pointer rounded px-1.5 py-0.5 mt-1": true,
        "hover:shadow hover:bg-white-1/[3%]": editable,
      })}
    >
      {children}
    </div>
  );
}

function HealthPopover({ project, editable }) {
  const label = (
    <SelectBox editable={editable}>
      <div className="flex items-center gap-1 -ml-1">
        <ProjectIcons.IconForHealth health={"on-track"} />
        On Track
      </div>
    </SelectBox>
  );

  return (
    <Popover.Root>
      <Popover.Trigger>{label}</Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="outline-none">
          <div className="p-1 bg-dark-3 rounded-lg shadow-lg border border-dark-5 mt-2">
            <div className="font-bold text-sm px-2 py-1 mr-4">Change project health</div>

            <div className="border-t border-white-2/5 my-1" />

            <HealthPopoverOption title="On-Track" health="on-track" project={project} />
            <HealthPopoverOption title="At Risk" health="at-risk" project={project} />
            <HealthPopoverOption title="Off-Track" health="off-track" project={project} />

            <div className="border-t border-white-2/5 my-1" />

            <HealthPopoverOption title="Unknown" health="unknown" project={project} />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function PhasePopover({ project, editable }) {
  const label = (
    <SelectBox editable={editable}>
      <ProjectIcons.IconForPhase phase={project.phase} />
      <span className="capitalize font-medium text-white-1/80">{project.phase}</span>
    </SelectBox>
  );

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

function HealthPopoverOption({ health, title, project }) {
  const navigate = useNavigate();
  const active = project.health === health;

  const onClick = () => {
    if (active) return;

    navigate(`/projects/${project.id}/updates/new?health=${health}`);
  };

  return (
    <div
      className="flex items-center justify-between gap-8 hover:bg-shade-1 cursor-pointer px-2 py-1 rounded text-sm font-medium"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <ProjectIcons.IconForHealth health={health} />
        <span className="capitalize">{title}</span>
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
      <DatePickerWithClear
        editable={project.champion.id === me.id}
        selected={startDate}
        onChange={change}
        placeholder="Start Date"
      />
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
      <DatePickerWithClear
        editable={project.champion.id === me.id}
        selected={dueDate}
        onChange={change}
        placeholder="Due Date"
      />
    </div>
  );
}

function DatePickerWithClear({ selected, onChange, editable = true, placeholder }) {
  const [open, setOpen] = React.useState(false);

  const handleChange = (date: Date | null) => {
    if (!editable) return;

    onChange(date);
    setOpen(false);
  };

  let value = (
    <SelectBox editable={editable}>
      {selected ? (
        <FormattedTime time={selected} format="short-date" />
      ) : (
        <span className="text-white-1/60">{placeholder}</span>
      )}
    </SelectBox>
  );

  return (
    <Popover.Root open={open} onOpenChange={(state) => setOpen(state)}>
      <Popover.Trigger>{value}</Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="outline-none">
          <div className="p-1 bg-dark-3 rounded-lg shadow-lg border border-dark-5 mt-2">
            <DatePicker
              inline
              selected={selected}
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
