import React from "react";

import DatePicker from "react-datepicker";
import FormattedTime from "@/components/FormattedTime";

import * as Projects from "@/graphql/Projects";
import * as Time from "@/utils/time";

export default function Timeline({ me, project, refetch }) {
  return (
    <div className="flex items-center gap-8 mb-4">
      <StartDate me={me} project={project} refetch={refetch} />
      <DueDate me={me} project={project} refetch={refetch} />
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
