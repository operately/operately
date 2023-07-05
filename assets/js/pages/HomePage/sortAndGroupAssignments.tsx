import React from "react";

import { isSameWeek, isThisWeek, isToday, isPast, endOfDay } from "date-fns";

import { Link } from "react-router-dom";

import * as Icons from "@tabler/icons-react";
import * as Assignments from "@/graphql/Assignments";

import FormattedTime from "@/components/FormattedTime";

interface AssignmentElement {
  type: string;
  time: Date | string;
  element: React.ReactNode;
  link: string;
}

export interface SortedAndGroupedAssignments {
  pending: AssignmentElement[];
  upcoming: AssignmentElement[];
}

function toAssigmentElementList(assignments: Assignments.Assignments): AssignmentElement[] {
  let flatAssignments: AssignmentElement[] = [];

  assignments.milestones.forEach((milestone) => {
    flatAssignments.push({
      type: "milestone",
      time: milestone.deadlineAt && new Date(Date.parse(milestone.deadlineAt)),
      element: <MilestoneAssignment key={milestone.id} milestone={milestone} />,
      link: `/projects/${milestone.project.id}/milestones`,
    });
  });

  assignments.projectStatusUpdates.forEach((project) => {
    flatAssignments.push({
      type: "status_update",
      time: project.nextUpdateScheduledAt && new Date(Date.parse(project.nextUpdateScheduledAt)),
      element: <StatusUpdateAssignment key={project.id} project={project} />,
      link: `/projects/${project.id}/status_updates`,
    });
  });

  return flatAssignments.sort((a, b) => +a.time - +b.time);
}

function StatusUpdateAssignment({ project }) {
  return (
    <Assingment
      key={project.id}
      time={project.nextUpdateScheduledAt}
      icon={<IconStatusUpdate />}
      linkTo={`/projects/${project.id}/statut_updates`}
    >
      Write a status update for the <strong>{project.name}</strong> project
    </Assingment>
  );
}

function MilestoneAssignment({ milestone }) {
  return (
    <Assingment
      key={milestone.id}
      time={milestone.deadlineAt}
      icon={<IconMilestone />}
      linkTo={`/projects/${milestone.project.id}/milestones`}
    >
      The <strong>{milestone.title}</strong> milestone on the <strong>{milestone.project.name}</strong> project is due
    </Assingment>
  );
}

export function sortAndGroupAssignemnts(assignments: Assignments.Assignments): SortedAndGroupedAssignments {
  let assignmentElements = toAssigmentElementList(assignments);

  let result: SortedAndGroupedAssignments = {
    pending: [],
    upcoming: [],
  };

  assignmentElements.forEach((assignment) => {
    if (assignment.time < endOfDay(new Date())) {
      result.pending.push(assignment);
    } else {
      result.upcoming.push(assignment);
    }
  });

  return result;
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

function Assingment({ time, icon, linkTo, children }) {
  let timeDate = new Date(Date.parse(time));

  const timeClassBase = "text-white-1 font-semibold px-2 rounded-lg py-1 text-xs w-24 text-center shrink-0 truncate";
  const timeClass = timeClassBase + " bg-dark-5";
  const overdueClass = timeClassBase + " bg-red-500";

  let overdue = !isToday(timeDate) && isPast(timeDate);

  return (
    <Link to={linkTo}>
      <div className="flex items-center justify-between mx-14 hover:bg-dark-4 px-2 py-2 cursor-pointer">
        <div className="flex gap-2 items-center justify-center">
          <div className="shrink-0">{icon}</div>
          <div>{children}</div>
        </div>
        <div className={overdue ? overdueClass : timeClass}>
          <FormattedTime time={timeDate} format="relative-day" />
        </div>
      </div>
    </Link>
  );
}

function isNextWeek(date: Date) {
  return isSameWeek(date, new Date(+new Date() + 604800000));
}
