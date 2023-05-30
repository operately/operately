import React from "react";

import Icon from "@/components/Icon";
import FormattedTime from "@/components/FormattedTime";

import * as Milestones from "@/graphql/Projects/milestones";

function MilestoneStatus({ milestone }) {
  if (milestone.status === "done") {
    return <span className="text-brand-1 text-sm">Completed</span>;
  }

  if (Milestones.isOverdue(milestone)) {
    return <span className="text-danger-1 text-sm">Overdue</span>;
  }

  return <></>;
}

function RedMilestoneIcon() {
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
}

function MilestoneIcon({ milestone }) {
  if (milestone.status === "done") {
    return <Icon name="milestone" color="brand" size="base" />;
  }

  if (Milestones.isOverdue(milestone)) {
    return <RedMilestoneIcon />;
  }

  return <Icon name="milestone" color="dark" size="base" />;
}

function Milestone({ milestone }) {
  return (
    <div className="flex items-center justify-between m-[10px] group">
      <div className="flex items-center gap-[10px]">
        <MilestoneIcon milestone={milestone} />

        <span className="text-dark-1">{milestone.title}</span>
        <span className="text-dark-2 text-sm">
          <FormattedTime time={milestone.deadlineAt} format="short-date" />
        </span>
        <MilestoneStatus milestone={milestone} />
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

function MilestoneList({ milestones }) {
  const { completed, pending } = Milestones.splitByCompletion(milestones);

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

function TodayMarker({ leftPos }) {
  return (
    <div
      className="absolute overflow-hidden inset-0 -top-[36px] w-[100px] flex flex-col items-center h-[116px]"
      style={{
        marginLeft: "-50px",
        left: leftPos,
      }}
    >
      <span className="text-[9px] text-brand-1 leading-[20px] tracking-[2%] mt-2">
        Today
      </span>
      <div className="border-l border-brand-1 flex-1 mt-0.5"></div>
    </div>
  );
}

function SmallMarker({ leftPos }) {
  return (
    <div
      style={{
        left: leftPos,
        borderLeft: "1px solid var(--color-dark-8p)",
        position: "absolute",
        top: "35px",
        bottom: "3px",
      }}
    />
  );
}

function BigMarker({ leftPos, title }) {
  return (
    <div
      style={{
        left: leftPos,
        borderLeft: "1px solid var(--color-dark-8p)",
        position: "absolute",
        top: "0px",
        bottom: "0px",
      }}
    >
      <span
        className="text-[9px] text-dark-2 leading-[20px]"
        style={{
          whiteSpace: "nowrap",
          position: "absolute",
          left: leftPos,
          marginLeft: "5px",
        }}
      >
        {title}
      </span>
    </div>
  );
}

function MilestoneMarker({ leftPos, milestone }) {
  let color = "";

  if (milestone.status === "done") {
    color = "var(--color-brand-1)";
  } else {
    if (Milestones.isOverdue(milestone)) {
      color = "var(--color-danger-1)";
    } else {
      color = "var(--color-dark-2)";
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        background: color,
        left: leftPos,
        borderRadius: "100%",
        width: "14px",
        height: "14px",
        top: "49px",
        marginLeft: "-6px",
      }}
    ></div>
  );
}

function Ticks({ leftPos, days, resolution }) {
  switch (resolution) {
    case "day-and-weeks":
      return (
        <>
          {days.map((day) =>
            day.getDay() === 0 ? (
              <BigMarker
                leftPos={leftPos(day)}
                title={
                  <FormattedTime time={day.toString()} format="short-date" />
                }
              />
            ) : (
              <SmallMarker leftPos={leftPos(day)} />
            )
          )}
        </>
      );
    case "day-and-months":
      return (
        <>
          {days.map((day) =>
            day.getDate() === 1 ? (
              <BigMarker
                leftPos={leftPos(day)}
                title={day.toLocaleString("default", { month: "short" })}
              />
            ) : (
              <SmallMarker leftPos={leftPos(day)} />
            )
          )}
        </>
      );
    case "weeks-and-months":
      return (
        <>
          {days.map((day) =>
            day.getDate() === 1 ? (
              <BigMarker
                leftPos={leftPos(day)}
                title={day.toLocaleString("default", { month: "short" })}
              />
            ) : day.getDay() === 0 ? (
              <SmallMarker leftPos={leftPos(day)} />
            ) : null
          )}
        </>
      );

    default:
      throw new Error("Invalid resolution " + resolution);
  }
}

function PhaseMarker({ title, subtitle, leftPos }) {
  return (
    <div
      className="text-sm"
      style={{
        position: "absolute",
        left: leftPos,
        whiteSpace: "nowrap",
        background: "white",
      }}
    >
      <div className="font-bold">{title}</div>
      <div>{subtitle}</div>
    </div>
  );
}

function DayMarkers({ startDate, endDate, milestones, project }) {
  const dayInMs = 86400000;

  let today = +Date.now();
  let start = Date.parse(startDate);
  let end = Date.parse(endDate);

  if (Date.now() > end) {
    end = Date.now() + 7 * dayInMs;
  }

  let days: Date[] = [];
  for (let i = start; i <= end; i += dayInMs) {
    days.push(new Date(i));
  }

  let dayWidth = 100.0 / days.length;

  let leftPos = (date: Date | number) => {
    let start = +Date.parse(startDate);

    return dayWidth * ((+date - start) / dayInMs) + "%";
  };

  let resolution = "day-and-weeks";
  if (end - start > 90 * dayInMs) {
    resolution = "day-and-months";
  }
  if (end - start > 180 * dayInMs) {
    resolution = "weeks-and-months";
  }

  return (
    <div
      className="relative border-t border-b border-dark-8p mt-[36px]"
      style={{ height: "80px" }}
    >
      <div className="absolute overflow-hidden inset-0">
        <Ticks leftPos={leftPos} days={days} resolution={resolution} />
      </div>

      <div className="absolute inset-0 overflow-hidden">
        {milestones.map((milestone) => (
          <MilestoneMarker
            leftPos={leftPos(Date.parse(milestone.deadlineAt))}
            milestone={milestone}
          />
        ))}
      </div>

      <TodayMarker leftPos={leftPos(today)} />

      <div className="absolute top-[88px] h-[40px] left-0 right-0">
        <PhaseMarker
          title="Start"
          subtitle="Kicked off by Mihailo"
          leftPos={leftPos(project.staredAt)}
        />
        <PhaseMarker
          title="Concept"
          subtitle="Completed"
          leftPos={leftPos(Date.parse("2023-02-15"))}
        />
        <PhaseMarker
          title="Execution"
          subtitle="Delayed by 9 days"
          leftPos={leftPos(Date.parse("2023-02-22"))}
        />
        <PhaseMarker
          title="Control"
          subtitle=""
          leftPos={leftPos(Date.parse("2023-05-15"))}
        />
        <PhaseMarker
          title="Done"
          subtitle=""
          leftPos={leftPos(Date.parse("2023-06-01"))}
        />
      </div>
    </div>
  );
}

function TimelineWidget({ project, milestones }) {
  return (
    <div className="">
      <FinishPhase />
      <div className="h-[236px] border border-light-2 rounded-[6px] relative z-20 bg-white pt-[52px]">
        <DayMarkers
          startDate="2023-02-01"
          endDate="2023-04-30"
          milestones={milestones}
          project={project}
        />
      </div>
    </div>
  );
}

export default function Timeline({ data }) {
  const milestones = Milestones.sortByDeadline(data.project.milestones);

  return (
    <>
      <TimelineWidget milestones={milestones} project={data.project} />
      <MilestoneList milestones={milestones} />
    </>
  );
}
