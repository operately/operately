import { IconBuildings, IconTarget, IconUserCheck, IconUserStar } from "@tabler/icons-react";
import React from "react";
import { GoalPage } from ".";
import { Avatar } from "../Avatar";
import { BlackLink, DivLink } from "../Link";
import { Summary } from "../RichContent";
import { StatusBadge } from "../StatusBadge";

import DateDisplayField from "../DateDisplayField";
import FormattedTime from "../FormattedTime";
import { PersonField } from "../PersonField";
import classNames from "../utils/classnames";

export function Sidebar(props: GoalPage.Props) {
  return (
    <div className="sm:col-span-4 space-y-6 hidden sm:block sm:pl-8">
      <LastCheckIn {...props} />

      <SidebarSection title="Properties">
        <div className="flex flex-col gap-2">
          <Status {...props} />
          <Champion {...props} />
          <Reviewer {...props} />
          <DueDate {...props} />
        </div>
      </SidebarSection>
      <Hirerarchy {...props} />
    </div>
  );
}

function DueDate(props: GoalPage.Props) {
  const [date, setDate] = React.useState<Date | null>(props.dueDate);

  React.useEffect(() => {
    setDate(props.dueDate);
  }, [props.dueDate]);

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
    <Property title="Due Date">
      <div className="-mt-1 pt-2">
        <DateDisplayField date={date} readonly={!props.canEdit} onChange={saveDate} />
      </div>
    </Property>
  );
}

function Hirerarchy(props: GoalPage.Props) {
  return (
    <SidebarSection title="Hirerarchy">
      <div className="flex items-start gap-1.5 text-sm">
        <IconBuildings size={14} className="shrink-0 mt-[2px]" />
        <BlackLink to={props.parentGoal!.link} underline="hover">
          Acme Inc.
        </BlackLink>
      </div>
      <div className="h-[8px] w-px bg-surface-outline ml-[7px]" />
      <div className="flex items-start gap-1.5 text-sm">
        <IconTarget size={14} className="text-red-500 shrink-0 mt-[2px]" />
        <BlackLink to={props.parentGoal!.link} underline="hover">
          Scale company
        </BlackLink>
      </div>
      <div className="h-[8px] w-px bg-surface-outline ml-[7px]" />
      <div className="flex items-start gap-1.5 text-sm">
        <IconTarget size={14} className="text-red-500 shrink-0 mt-[2px]" />
        <BlackLink to={props.parentGoal!.link} underline="hover">
          {props.parentGoal!.name}
        </BlackLink>
      </div>
      <div className="h-[8px] w-px bg-surface-outline ml-[7px]" />
      <div className="flex items-start gap-1.5 text-sm font-semibold">
        <IconTarget size={14} className="text-red-500 shrink-0 mt-[2px]" />
        {props.goalName}
      </div>
    </SidebarSection>
  );
}

function Champion(props: GoalPage.Props) {
  return (
    <Property title="Champion">
      <PersonField
        person={props.champion}
        setPerson={props.setChampion}
        readonly={!props.canEdit}
        showTitle={false}
        avatarSize={20}
        searchPeople={props.championSearch}
        emptyStateMessage="Set champion"
        emptyStateReadOnlyMessage="No champion"
        extraDialogMenuOptions={[
          {
            label: "Assign as reviewer",
            onClick: () => {
              props.setReviewer(props.champion!);
              props.setChampion(null);
            },
            icon: IconUserCheck,
          },
        ]}
      />
    </Property>
  );
}

function Reviewer(props: GoalPage.Props) {
  return (
    <Property title="Reviewer">
      <PersonField
        person={props.reviewer}
        setPerson={props.setReviewer}
        readonly={!props.canEdit}
        showTitle={false}
        avatarSize={20}
        searchPeople={props.reviewerSearch}
        emptyStateMessage="Set reviewer"
        emptyStateReadOnlyMessage="No reviewer"
        extraDialogMenuOptions={[
          {
            label: "Assign as champion",
            onClick: () => {
              props.setReviewer(null);
              props.setChampion(props.reviewer!);
            },
            icon: IconUserStar,
          },
        ]}
      />
    </Property>
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
      <div className="text-sm">
        <DivLink to={checkIn.link} className={className}>
          <div className="flex items-center font-semibold">
            Last Check In - <FormattedTime time={checkIn.date} format="short-date" />
          </div>

          <Summary content={checkIn.content} characterCount={130} mentionedPersonLookup={props.mentionedPersonLookup} />

          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Avatar person={checkIn.author} size={20} />
              {checkIn.author.fullName.split(" ")[0]}
            </div>
            <StatusBadge status={checkIn.status} hideIcon className="scale-95 inline-block shrink-0 align-[5px]" />
          </div>
        </DivLink>
      </div>
    );
  }
}

function Status(props: GoalPage.Props) {
  return (
    <Property title="Status">
      <div className="-mt-1 -ml-1">
        <StatusBadge status={props.status} className="scale-[90%]" />
      </div>
    </Property>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="">
      <div className="font-bold text-sm mb-2">{title}</div>
      {children}
    </div>
  );
}

function Property({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="text-[13px] font-medium text-content-dimmed w-24 leading-none">{title}</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
