import * as React from "react";
import * as People from "@/models/people";
import * as Timeframes from "@/utils/timeframes";

import { Card } from "../NotificationCard";
import { createPath } from "@/utils/paths";
import { ActivityContentGoalEditing } from "@/gql";

export default function ({ notification }) {
  const author = notification.activity.author;
  const content = notification.activity.content;

  const path = createPath("goals", content.goalId);

  return (
    <Card
      notification={notification}
      title={
        <>
          {People.firstName(author)} {shortDesc(content)}
        </>
      }
      author={author}
      link={path}
      where={content.newName}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}

function shortDesc(content: ActivityContentGoalEditing): string {
  const oldTimeframe = Timeframes.parse(content.oldTimeframe);
  const newTimeframe = Timeframes.parse(content.newTimeframe);

  const changes = {
    name: content.oldName !== content.newName,
    timeframe: !Timeframes.equalDates(oldTimeframe, newTimeframe),
    champion: content.oldChampionId !== content.newChampionId,
    reviewer: content.oldReviewerId !== content.newReviewerId,
    measurements: content.addedTargets.length + content.updatedTargets.length + content.deletedTargets.length > 0,
  };

  const activeChanges = Object.keys(changes).filter((key) => changes[key]);

  return "changed the goal's " + joinChanges(activeChanges);
}

function joinChanges(changes: string[]): string {
  if (changes.length === 0) return "";
  if (changes.length === 1) return changes[0]!;
  if (changes.length === 2) return changes[0]! + " and " + changes[1]!;

  return changes.slice(0, -1).join(", ") + ", and " + changes[changes.length - 1]!;
}
