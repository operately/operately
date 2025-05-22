import { IconBuilding, IconCalendar, IconQuestionMark, IconTarget } from "@tabler/icons-react";
import React from "react";
import { GoalPage } from ".";
import { Avatar } from "../Avatar";
import FormattedTime from "../FormattedTime";
import { BlackLink, DivLink } from "../Link";
import { Summary } from "../RichContent";
import { StatusBadge } from "../StatusBadge";
import classNames from "../utils/classnames";

export function Sidebar(props: GoalPage.Props) {
  return (
    <div className="sm:col-span-4 space-y-6 hidden sm:block sm:pl-8">
      <LastCheckIn {...props} />

      <div className="space-y-2">
        <div className="font-bold text-sm">Parent Goal</div>
        <ParentGoal {...props} />
      </div>

      <div className="space-y-2">
        <div className="font-bold text-sm">Due Date</div>
        <div className="flex items-center gap-2">
          <IconCalendar size={20} />
          <div className="text-sm font-medium mt-0.5">
            {props.timeframe?.startDate && <FormattedTime time={props.timeframe!.endDate!} format="short-date" />}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-bold text-sm">Champion</div>
        <Champion {...props} />
      </div>

      <div className="space-y-2">
        <div className="font-bold text-sm">Reviewer</div>
        <Reviewer {...props} />
      </div>
    </div>
  );
}

function ParentGoal(props: GoalPage.Props) {
  if (!props.parentGoal) {
    return <CompanyWideGoal />;
  } else {
    return <ParentGoalLink {...props} />;
  }
}

function CompanyWideGoal() {
  return (
    <div className="flex items-center gap-1.5 text-sm mb-2">
      <IconBuilding size={14} />
      <span>Company-wide goal</span>
    </div>
  );
}

function ParentGoalLink(props: GoalPage.Props) {
  return (
    <div className="flex items-center gap-1.5 text-sm mb-2">
      <IconTarget size={14} className="text-red-500" />
      <BlackLink to={props.parentGoal!.link} underline="hover">
        {props.parentGoal!.name}
      </BlackLink>
    </div>
  );
}

function Champion(props: GoalPage.Props) {
  if (!props.champion) {
    const message = props.canEdit ? "Assign a champion to get started" : "No champion assigned";

    return <MissingContributor role="No Champion" description={message} />;
  } else {
    return <Contributor person={props.champion} />;
  }
}

function Reviewer(props: GoalPage.Props) {
  if (!props.canEdit && !props.reviewer) return null;

  if (!props.reviewer) {
    return <MissingContributor role="No Reviewer" description="Assign a reviewer to get feedback" />;
  } else {
    return <Contributor person={props.reviewer} />;
  }
}

function MissingContributor({ role, description }: { role: string; description: string }) {
  return (
    <div className="flex items-start gap-2 truncate">
      <div className="bg-yellow-500/10 rounded-full h-[32px] w-[32px] flex items-center justify-center">
        <IconQuestionMark className="text-yellow-800" size={20} />
      </div>

      <div className="-mt-0.5 truncate">
        <div className="text-sm font-medium">{role}</div>
        <div className="text-xs truncate">{description}</div>
      </div>
    </div>
  );
}

function Contributor({ person }: { person: GoalPage.Person }) {
  return (
    <div className="flex items-start gap-2 truncate">
      <Avatar person={person} size={32} />

      <div className="-mt-0.5 truncate">
        <div className="text-sm font-medium">{person.fullName}</div>
        <div className="text-xs truncate">{person.title}</div>
      </div>
    </div>
  );
}

function LastCheckIn(props: GoalPage.Props) {
  if (props.checkIns.length === 0) {
    return null;
  } else {
    const checkIn = props.checkIns[0]!;

    let borderColor = "";

    if (checkIn.status === "on_track") {
      borderColor = "border-green-500";
    } else if (checkIn.status === "caution" || checkIn.status === "concern") {
      borderColor = "border-yellow-500";
    } else if (checkIn.status === "issue") {
      borderColor = "border-red-500";
    }

    const className = classNames(
      "flex gap-1 flex-col",
      "cursor-pointer hover:bg-surface-highlight text-sm shadow-sm p-4 border",
      "border-l-8",
      "mb-12",
      borderColor,
    );

    return (
      <div className="text-sm">
        <DivLink to={checkIn.link} className={className}>
          <div className="flex items-center gap-2 justify-between mb-1">
            <div className="font-bold text-sm">Last Check-In</div>
            <StatusBadge status={checkIn.status} hideIcon className="scale-90 inline-block shrink-0 align-[5px]" />
          </div>

          <Summary content={checkIn.content} characterCount={130} mentionedPersonLookup={props.mentionedPersonLookup} />

          <div className="mt-1.5 flex items-center">
            <Avatar person={checkIn.author} size={18} />
            <span className="text-sm text-text-tertiary inline-flex items-center gap-1 ml-2">
              {checkIn.author.fullName.split(" ")[0]} &bull; <FormattedTime time={checkIn.date} format="short-date" />{" "}
            </span>
          </div>
        </DivLink>
      </div>
    );
  }
}
