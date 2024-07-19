import React, { useMemo, useState } from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { IconTarget, IconHexagons } from "@tabler/icons-react";
import FormattedTime from "@/components/FormattedTime";

import { Paths } from "@/routes/paths";
import { ReviewAssignment } from "@/api";
import { AssignmentType } from "@/models/assignments";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { calculateHowManyDaysAgo } from "@/utils/time";
import { useLoadedData } from "./loader";


export function Page() {
  const { assignmentsCount } = useLoadedData();

  const noAssignments = assignmentsCount === 0;
  const title = noAssignments ? "Review" : `Review (${assignmentsCount})`;

  return (
    <Pages.Page title={title}>
      <Paper.Root size="large">
        <Paper.Body minHeight="600px">
          <div className="text-content-accent text-3xl font-bold">{title}</div>
          <p className="mt-2">Your due actions as a champion and/or reviewer{noAssignments ? " will appear here." : "."}</p>
        
          <AssignmentsList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}


function AssignmentsList() {
  const { assignments } = useLoadedData();

  return (
    <div className="flex flex-col pt-10">
      {assignments.map((assignment) => (
        <AssignmentItem assignment={assignment} key={assignment.id} />
      ))}
    </div>
  )
}

function AssignmentItem({ assignment }: { assignment: ReviewAssignment }) {
  const { link } = parseInformation(assignment);

  const navigate = useNavigateTo(link);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={navigate}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex gap-4 items-center pt-6 pb-6 border-b first:border-t hover:cursor-pointer"
    >
      <DueDate date={assignment.due!} />
      <div className="flex gap-4 items-start">
        <AssignmentIcon type={assignment.type as AssignmentType} />
        <AssignmentInfo assignment={assignment} isHovered={isHovered} />
      </div>
    </div>
  );
}

function DueDate({ date }: { date: string }) {
  const daysAgo = calculateHowManyDaysAgo(date);
  const isRed = useMemo(() => !["Today", "Yesterday"].includes(daysAgo), []);
  
  return (
    <div className="flex flex-col min-w-[110px]">
      <b>
        <FormattedTime time={date} format="short-date" />
      </b>
      <span className={`text-sm ${isRed ? "text-red-500" : "text-content-dimmed"}`}>
        {daysAgo}
      </span>
    </div>
  )
}

function AssignmentIcon({ type }: { type: AssignmentType }) {
  const SIZE = 26;
  const GOAL_COLOR = "text-red-500 shrink-0";
  const PROJECT_COLOR = "text-indigo-500 shrink-0";

  switch(type) {
    case "project":
      return <IconHexagons size={SIZE} className={PROJECT_COLOR} />;
    case "check_in":
      return <IconHexagons size={SIZE} className={PROJECT_COLOR} />;
    case "goal_update":
      return <IconTarget size={SIZE} className={GOAL_COLOR} />;
    case "goal":
      return <IconTarget size={SIZE} className={GOAL_COLOR} />;
  }
}

function AssignmentInfo({ assignment, isHovered }: { assignment: ReviewAssignment; isHovered: boolean }) {
  const { title, content } = parseInformation(assignment);

  const className = `mb-1 transition-colors duration-300 ${isHovered && "text-link-base"}`;

  return (
    <div data-test-id={assignment.id}>
      <p className={className}><b>{title}</b> {assignment.name}</p>
      {content && (
        <p className="text-sm">{assignment.championName} {content}</p>
      )}
    </div>
  );
}


function parseInformation(assignment: ReviewAssignment) {
  switch(assignment.type as AssignmentType) {
    case "project":
      return {
        title: "Write the weekly check-in:",
        link: Paths.projectCheckInNewPath(assignment.id!),
      };
    case "goal":
      return {
        title: "Update progress:",
        link: Paths.goalProgressUpdateNewPath(assignment.id!),
      };
    case "check_in":
      return {
        title: "Review:",
        content: "submitted a weekly check-in",
        link: Paths.projectCheckInPath(assignment.id!),
      };
    case "goal_update":
      return {
        title: "Review:",
        content: "submitted an update",
        link: Paths.goalProgressUpdatePath(assignment.id!),
      };
  }
}
