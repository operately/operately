import { IconBuilding, IconQuestionMark, IconTarget } from "@tabler/icons-react";
import React from "react";
import { GoalPage } from ".";
import { Avatar } from "../Avatar";
import { BlackLink, DivLink } from "../Link";
import { Summary } from "../RichContent";
import { StatusBadge } from "../StatusBadge";

import DateDisplayField from "../DateDisplayField";
import FormattedTime from "../FormattedTime";
import classNames from "../utils/classnames";

export function Sidebar(props: GoalPage.Props) {
  return (
    <div className="sm:col-span-4 space-y-6 hidden sm:block sm:pl-8">
      <LastCheckIn {...props} />
      <ParentGoal {...props} />
      <DueDate {...props} />

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

function DueDate(props: GoalPage.Props) {
  const [date, setDate] = React.useState<Date | null>(props.timeframe?.endDate ?? null);

  React.useEffect(() => {
    setDate(props.timeframe?.endDate ?? null);
  }, [props.timeframe?.endDate]);

  const saveDate = (newDate: Date | null) => {
    if (date?.getTime() === newDate?.getTime()) return; // No change

    const previousDate = date;
    setDate(newDate);

    props.updateDueDate(newDate).then((success) => {
      if (!success) {
        // If the update fails, revert to the previous date
        setDate(previousDate);
      }
    });
  };

  return (
    <SidebarSection title="Due Date">
      <DateDisplayField date={date} readonly={!props.canEdit} onChange={saveDate} />
    </SidebarSection>
  );
}

function ParentGoal(props: GoalPage.Props) {
  return (
    <SidebarSection title="Parent Goal">
      {!props.parentGoal ? <CompanyWideGoal /> : <ParentGoalLink {...props} />}
    </SidebarSection>
  );
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
    <div className="flex items-start gap-1.5 text-sm mb-2">
      <IconTarget size={18} className="text-red-500 shrink-0 mt-px" />
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
      "cursor-pointer text-sm py-3 pl-3 pr-4",
      "border-l-4",
      "bg-zinc-50 dark:bg-zinc-800",
      "hover:bg-zinc-100 dark:hover:bg-zinc-700",
      borderColor,
    );

    return (
      <SidebarSection title="Last Check-In">
        <div className="text-sm">
          <DivLink to={checkIn.link} className={className}>
            <div className="flex items-center font-semibold">
              <FormattedTime time={checkIn.date} format="short-date" />
            </div>

            <Summary
              content={checkIn.content}
              characterCount={130}
              mentionedPersonLookup={props.mentionedPersonLookup}
            />

            <div className="mt-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Avatar person={checkIn.author} size={20} />
                {checkIn.author.fullName.split(" ")[0]}
              </div>
              <StatusBadge status={checkIn.status} hideIcon className="scale-95 inline-block shrink-0 align-[5px]" />
            </div>
          </DivLink>
        </div>
      </SidebarSection>
    );
  }
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="font-bold text-sm">{title}</div>
      {children}
    </div>
  );
}
