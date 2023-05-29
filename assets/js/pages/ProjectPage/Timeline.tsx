import React from "react";

import Icon from "@/components/Icon";
import FormattedTime from "@/components/FormattedTime";

import * as GraphQlProjects from "@/graphql/Projects";

function MilestoneStatus({ status, deadlineAt }) {
  if (status === "done") {
    return <span className="text-brand-1 text-sm">Completed</span>;
  } else {
    if (+new Date(deadlineAt) < +new Date()) {
      return <span className="text-danger-1 text-sm">Overdue</span>;
    } else {
      return <></>;
    }
  }
}

function MilestoneIcon({ status, deadlineAt }) {
  if (status === "done") {
    return <Icon name="milestone" color="brand" size="base" />;
  } else {
    if (+new Date(deadlineAt) < +new Date()) {
      return (
        <svg
          width="24"
          height="25"
          viewBox="0 0 24 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 21.3184H10"
            stroke="#D25034"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M8 21.3184V3.31836"
            stroke="#D25034"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M8 4.31836L17 8.31836L8 12.3184"
            stroke="#D25034"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      );
    } else {
      return <Icon name="milestone" color="dark" size="base" />;
    }
  }
}

function Milestone({ milestone }) {
  return (
    <div className="flex items-center justify-between m-[10px] group">
      <div className="flex items-center gap-[10px]">
        <MilestoneIcon
          status={milestone.status}
          deadlineAt={milestone.deadlineAt}
        />

        <span className="text-dark-1">{milestone.title}</span>
        <span className="text-dark-2 text-sm">
          <FormattedTime time={milestone.deadlineAt} format="short-date" />
        </span>
        <MilestoneStatus
          status={milestone.status}
          deadlineAt={milestone.deadlineAt}
        />
      </div>

      <div className="opacity-0 group-hover:opacity-100">
        <Icon name="menu dots" color="dark-2" size="base" />
      </div>
    </div>
  );
}

function SectionHeader({ title, className }) {
  return (
    <h3 className={"uppercase text-sm tracking-[0.3px]" + " " + className}>
      {title}
    </h3>
  );
}

SectionHeader.defaultProps = {
  className: "",
};

function AddMilestone() {
  return (
    <div className="mt-[18px]">
      <a
        href="#"
        className="text-brand-1 flex items-center text-sm gap-[5px] underline underline-offset-2 font-bold"
      >
        <Icon name="plus" color="brand" size="small" />
        Add milestone
      </a>
    </div>
  );
}

function Milestones({ milestones }) {
  const { completed, pending } =
    GraphQlProjects.splitMilestonesByCompletion(milestones);

  return (
    <div className="mt-[24px]">
      <div className="flex items-center gap-[10px]">
        <Icon name="milestone" color="brand" size="base" />
        <SectionHeader title="Milestones" />
      </div>

      <SectionHeader title="Upcoming" className="text-dark-2 mt-[20px]" />

      {pending.map((milestone) => (
        <Milestone key={milestone.id} milestone={milestone} />
      ))}

      <SectionHeader title="Completed" className="text-dark-2 mt-[20px]" />

      {completed.map((milestone) => (
        <Milestone key={milestone.id} milestone={milestone} />
      ))}

      <AddMilestone />
    </div>
  );
}

function FinishPhase() {
  return (
    <div className="mt-[25px] flex relative z-10">
      <a
        href="#"
        className="text-brand-1 flex items-center text-sm gap-[5px] underline underline-offset-2 font-bold bg-brand-2"
        style={{
          paddingTop: "11px",
          paddingBottom: "20px",
          paddingLeft: "19px",
          paddingRight: "19px",
          marginBottom: "-10px",
          borderRadius: "8px 8px 0px 0px",
        }}
      >
        <Icon name="checkmark" color="brand" size="small" />
        Finish Execution Phase
      </a>
    </div>
  );
}

function TimelineWidget() {
  return (
    <div className="">
      <FinishPhase />
      <div className="h-[236px] border border-light-2 rounded-[6px] relative z-20 bg-white"></div>
    </div>
  );
}

export default function Timeline({ data }) {
  const milestones = GraphQlProjects.sortMilestonesByDeadline(
    data.project.milestones
  );

  return (
    <>
      <TimelineWidget />
      <Milestones milestones={milestones} />
    </>
  );
}
