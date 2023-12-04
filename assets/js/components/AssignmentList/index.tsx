import React from "react";

import { Link } from "react-router-dom";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import FormattedTime from "@/components/FormattedTime";

import * as Assignments from "@/graphql/Assignments";
import { Milestone } from "@/graphql/Projects/milestones";
import { Project } from "@/graphql/Projects";

import * as time from "@/utils/time";
import classnames from "classnames";

const Context = React.createContext({
  readOnly: false,
});

export function AssignmentList({ showUpcoming = true, readOnly = false }) {
  const assignments: Assignments.Assignments[] = [];
  const pending = assignments.filter((a) => time.parseISO(a.due) < time.endOfToday());
  const upcoming = assignments.filter((a) => time.parseISO(a.due) >= time.endOfToday());

  const hasPending = pending.length > 0;
  const hasUpcoming = upcoming.length > 0;

  return (
    <Context.Provider value={{ readOnly }}>
      <div>
        {hasPending ? pending.map((a, i) => <AssignmentItem key={i} assignment={a} />) : <EmptyInbox />}

        {showUpcoming && hasUpcoming && (
          <>
            <Paper.SectionHeader>Upcoming</Paper.SectionHeader>
            {upcoming.map((a, i) => (
              <AssignmentItem assignment={a} key={i} />
            ))}
          </>
        )}
      </div>
    </Context.Provider>
  );
}

function AssignmentItem({ assignment }: { assignment: Assignments.Assignments }) {
  switch (assignment.type) {
    case "milestone": {
      let milestone = assignment.resource as Milestone;
      let project = milestone.project as Project;
      let link = `/projects/${project!.id}/milestones/${milestone.id}`;
      let icon = <IconMilestone />;

      return (
        <AssignmentCard due={assignment.due} icon={icon} linkTo={link}>
          The <strong>{milestone.title}</strong> milestone on the <strong>{project.name}</strong> project is due
        </AssignmentCard>
      );
    }

    case "project_status_update": {
      let project = assignment.resource as Project;
      let icon = <IconStatusUpdate />;
      let link = `/projects/${project!.id}/updates/new`;

      return (
        <AssignmentCard due={assignment.due} icon={icon} linkTo={link}>
          Write a status update for the <strong>{project.name}</strong> project
        </AssignmentCard>
      );
    }

    default:
      console.error("Unknown assignment type", assignment);
      return null;
  }
}

function AssignmentCard({ due, icon, linkTo, children }) {
  const { readOnly } = React.useContext(Context);

  let timeDate = time.parseISO(due);

  const timeClassBase = "text-white-1 font-semibold px-2 rounded-lg py-1 text-xs w-24 text-center shrink-0 truncate";
  const timeClass = timeClassBase + " bg-dark-5";
  const overdueClass = timeClassBase + " bg-red-500";

  let overdue = !time.isToday(timeDate) && time.isPast(timeDate);

  const element = (
    <div
      className={classnames({
        "flex items-center justify-between py-2 cursor-pointer": true,
        "hover:bg-dark-4 cursor-pointer px-2": !readOnly,
      })}
    >
      <div className="flex gap-2 items-center justify-center">
        <div className="shrink-0">{icon}</div>
        <div>{children}</div>
      </div>
      <div className={overdue ? overdueClass : timeClass}>
        <FormattedTime time={timeDate} format="relative-day" />
      </div>
    </div>
  );

  if (readOnly) {
    return element;
  } else {
    return <Link to={linkTo}>{element}</Link>;
  }
}

function EmptyInbox() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Icons.IconSparkles size={24} className="text-yellow-400" />
      <div className="font-medium mt-2">Nothing for you today.</div>
    </div>
  );
}

function IconMilestone() {
  return (
    <div
      className="flex gap-2 items-center justify-center"
      style={{
        width: "35px",
        height: "35px",
        borderRadius: "100%",
        background: "linear-gradient(to right top, var(--color-green-400), var(--color-sky-400))",
      }}
    >
      <Icons.IconFlag size={24} stroke={2} className="text-dark-1" />
    </div>
  );
}

function IconStatusUpdate() {
  return (
    <div
      className="flex gap-2 items-center justify-center"
      style={{
        width: "35px",
        height: "35px",
        borderRadius: "100%",
        background: "linear-gradient(to right top, var(--color-pink-400), var(--color-purple-400))",
      }}
    >
      <Icons.IconReport size={24} stroke={2} className="text-dark-1" />
    </div>
  );
}
