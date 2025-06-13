import * as React from "react";

import ActivityHandler from "@/features/activities";
import * as Activities from "@/models/activities";
import { GoalActivities } from "@/models/goals";
import * as People from "@/models/people";
import * as Timeframes from "@/utils/timeframes";

import { match } from "ts-pattern";

import { AvatarLink } from "@/components/AvatarLink";
import FormattedTime from "@/components/FormattedTime";
import { richContentToString } from "@/components/RichContent";
import { DeprecatedPaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { truncateString } from "@/utils/strings";
import { DivLink, SecondaryButton } from "turboui";

import { StatusBadge } from "turboui";
import { DisableInEditMode, Title } from "./components";
import { useLoadedData } from "./loader";

interface Props {
  activity: Activities.Activity;
}

export function Messages() {
  const { goal } = useLoadedData();
  const writeMessagePath = DeprecatedPaths.newGoalDiscussionPath(goal.id!);

  return (
    <DisableInEditMode>
      <Title title="Conversations" />
      <MessagesList />

      <SecondaryButton size="xs" linkTo={writeMessagePath}>
        Write message
      </SecondaryButton>
    </DisableInEditMode>
  );
}

function MessagesList() {
  const { activities } = useLoadedData();

  return (
    <div className="mt-4">
      {activities.map((activity) => (
        <MessageItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

function MessageItem({ activity }: Props) {
  switch (activity.action as GoalActivities) {
    case "goal_check_in":
      return <CheckIn activity={activity} />;

    case "goal_timeframe_editing":
      const content = activity.content as Activities.ActivityContentGoalTimeframeEditing;
      const title = findTimeframeTitle(content.oldTimeframe, content.newTimeframe);
      return <CommentThread activity={activity} title={title} />;

    case "goal_discussion_creation":
      assertPresent(activity.commentThread, "commentThread must be present in activity");
      const discussionTitle = `Discussion • ${activity.commentThread.title}`;
      return <CommentThread activity={activity} title={discussionTitle} />;

    case "goal_closing":
      return <CommentThread activity={activity} title="Goal closed" />;

    case "goal_reopening":
      return <CommentThread activity={activity} title="Goal reopened" />;
  }
}

function CheckIn({ activity }: Props) {
  const content = activity.content as Activities.ActivityContentGoalCheckIn;

  assertPresent(activity.author, "author must be present in activity");
  assertPresent(content.update, "update must be present in activity content");

  return (
    <Container>
      <Author author={activity.author} />

      <PageLink activity={activity}>
        <MessageTitle title="Check In">
          <StatusBadge status={content.update.status!} hideIcon />
        </MessageTitle>

        <Content author={activity.author} date={content.update.insertedAt!} content={content.update.message!} />
      </PageLink>
    </Container>
  );
}

interface CommentThreadProps extends Props {
  title: string;
}

function CommentThread({ activity, title }: CommentThreadProps) {
  assertPresent(activity.author, "author must be present in activity");
  assertPresent(activity.commentThread, "commentThread must be present in activity");

  return (
    <Container>
      <Author author={activity.author} />

      <PageLink activity={activity}>
        <MessageTitle title={title} />

        <Content author={activity.author} date={activity.insertedAt!} content={activity.commentThread.message!} />
      </PageLink>
    </Container>
  );
}

interface ContentProps {
  author: People.Person;
  date: string;
  content: string;
}

function Content({ author, date, content }: ContentProps) {
  const fullMessage = richContentToString(JSON.parse(content));
  const message = truncateString(fullMessage, 180);

  return (
    <div className="text-sm mt-0.5">
      <span className="text-stone-500">
        <FormattedTime time={date} format="short-date" />
      </span>
      <span className="mx-1 text-stone-500">&bull;</span>
      <span className="text-stone-500">{People.shortName(author)}</span>
      {Boolean(message) && (
        <>
          <span className="mx-1 text-stone-500">&bull;</span>
          {message}
        </>
      )}
    </div>
  );
}

function Author({ author }) {
  return (
    <div className="font-bold flex items-center gap-1 pt-1">
      <AvatarLink person={author} size={30} />
    </div>
  );
}

function Container({ children }) {
  return <div className="flex items-start gap-3 pb-4 group">{children}</div>;
}

function MessageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="font-bold group-hover:underline underline-offset-2">{title}</span>
      {children}
    </div>
  );
}

function PageLink({ activity, children }) {
  const path = ActivityHandler.pagePath(activity);
  return <DivLink to={path}>{children}</DivLink>;
}

function findTimeframeTitle(oldTimeframe, newTimeframe) {
  const { days, type } = calculateTimeframeChange(oldTimeframe, newTimeframe);

  const daysStr = days === 1 ? "1 day" : `${days} days`;

  return match(type)
    .with("+", () => `Delay • Deadline extended by ${daysStr}`)
    .with("-", () => `Acceleration • Deadline reduced by ${daysStr}`)
    .otherwise(() => "Timeframe changed");
}

function calculateTimeframeChange(oldTimeframe, newTimeframe) {
  const prevCount = Timeframes.dayCount(oldTimeframe);
  const currCount = Timeframes.dayCount(newTimeframe);
  const diff = Math.abs(prevCount - currCount);

  if (prevCount < currCount) {
    return { days: diff, type: "+" };
  } else if (currCount < prevCount) {
    return { days: diff, type: "-" };
  } else {
    return { days: 0, type: "" };
  }
}
