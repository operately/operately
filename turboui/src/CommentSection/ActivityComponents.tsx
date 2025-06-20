import React from "react";
import { AvatarWithName } from "../Avatar";
import FormattedTime from "../FormattedTime";
import { IconSquareCheckFilled, IconSquareChevronsLeftFilled } from "../icons";
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

