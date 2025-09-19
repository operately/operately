import React from "react";
import { AvatarWithName } from "../Avatar";
import FormattedTime from "../FormattedTime";
import { IconSquareCheckFilled, IconSquareChevronsLeftFilled, IconFlag, IconFileText } from "../icons";
import { ActivityProps, AcknowledgmentProps } from "./types";

export function MilestoneCompletedActivity({ activity }: ActivityProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent relative">
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AvatarWithName 
              person={activity.author} 
              size="normal" 
              nameFormat="short"
              link={activity.author.profileLink}
              className="font-semibold"
            />
            <IconSquareCheckFilled size={20} className="text-accent-1" />
            <div className="pr-2 font-semibold text-content-accent">
              completed the milestone
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-content-dimmed text-sm">
              <FormattedTime time={activity.insertedAt} format="relative" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MilestoneReopenedActivity({ activity }: ActivityProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent relative">
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AvatarWithName 
              person={activity.author} 
              size="normal" 
              nameFormat="short"
              link={activity.author.profileLink}
              className="font-semibold"
            />
            <IconSquareChevronsLeftFilled size={20} className="text-yellow-500" />
            <div className="pr-2 font-semibold text-content-accent">
              re-opened the milestone
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-content-dimmed text-sm">
              <FormattedTime time={activity.insertedAt} format="relative" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MilestoneCreatedActivity({ activity }: ActivityProps) {
  return (
    <div className="flex gap-3 py-1.5 text-content-subtle text-sm relative ml-2">
      <div className="shrink-0 mt-0.5">
        <IconFlag size={16} className="text-blue-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <AvatarWithName
            person={activity.author}
            size="tiny"
            textSize="small"
            nameFormat="short"
            link={activity.author.profileLink}
            className="text-content-dimmed font-medium"
            showAvatar={false}
          />
          <span className="min-w-0">{activity.content || "created the milestone"}</span>
        </div>
      </div>

      <div className="shrink-0 mt-0.5">
        <span className="text-content-subtle text-xs">
          <FormattedTime time={activity.insertedAt} format="relative" />
        </span>
      </div>
    </div>
  );
}

export function MilestoneDescriptionActivity({ activity }: ActivityProps) {
  return (
    <div className="flex gap-3 py-1.5 text-content-subtle text-sm relative ml-2">
      <div className="shrink-0 mt-0.5">
        <IconFileText size={16} className="text-content-dimmed" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <AvatarWithName
            person={activity.author}
            size="tiny"
            textSize="small"
            nameFormat="short"
            link={activity.author.profileLink}
            className="text-content-dimmed font-medium"
            showAvatar={false}
          />
          <span className="min-w-0">{activity.content || "added a description"}</span>
        </div>
      </div>

      <div className="shrink-0 mt-0.5">
        <span className="text-content-subtle text-xs">
          <FormattedTime time={activity.insertedAt} format="relative" />
        </span>
      </div>
    </div>
  );
}

export function MilestoneUpdateActivity({ activity }: ActivityProps) {
  return (
    <div className="flex gap-3 py-1.5 text-content-subtle text-sm relative ml-2">
      <div className="shrink-0 mt-0.5">
        <IconFlag size={16} className="text-content-dimmed" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <AvatarWithName
            person={activity.author}
            size="tiny"
            textSize="small"
            nameFormat="short"
            link={activity.author.profileLink}
            className="text-content-dimmed font-medium"
            showAvatar={false}
          />
          <span className="min-w-0">{activity.content || "updated the milestone"}</span>
        </div>
      </div>

      <div className="shrink-0 mt-0.5">
        <span className="text-content-subtle text-xs">
          <FormattedTime time={activity.insertedAt} format="relative" />
        </span>
      </div>
    </div>
  );
}

export function AcknowledgmentActivity({ person, ackAt }: AcknowledgmentProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-6 not-first:border-t border-stroke-base text-content-accent">
      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center gap-2 font-bold flex-1">
          <AvatarWithName 
            person={person} 
            size="normal" 
            nameFormat="short"
            link={person.profileLink}
            className="font-semibold"
          />
          <span>acknowledged this Check-In</span>
          <IconSquareCheckFilled size={24} className="text-accent-1" />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-content-dimmed text-sm">
            <FormattedTime time={ackAt} format="relative" />
          </span>
        </div>
      </div>
    </div>
  );
}
