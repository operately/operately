import * as React from "react";
import * as Time from "@/utils/time";
import * as Activities from "@/models/activities";

import { Activity, Person } from "@/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";

import Avatar from "@/components/Avatar";
import ActivityHandler from "@/features/activities";
import FormattedTime from "@/components/FormattedTime";
import Api from "@/api";

export type Page = "company" | "project" | "goal" | "space" | "profile";

type ScopeType = "company" | "project" | "goal" | "space" | "person";

export function useItemsQuery(scopeType: ScopeType, scopeId: string) {
  return Api.useGetActivities({
    scopeType: scopeType,
    scopeId: scopeId,
    actions: [],
  });
}

export function Feed({ items, testId, page }: { items: Activity[]; testId?: string; page: Page }) {
  return (
    <ErrorBoundary fallback={<div>Ooops, something went wrong while loading the feed</div>}>
      <div className="w-full" data-test-id={testId}>
        {groupByDate(items).map((group, index) => (
          <ActivityGroup key={index} group={group} page={page} />
        ))}
      </div>
    </ErrorBoundary>
  );
}

function ActivityGroup({ group, page }: { group: ActivityGroup; page: string }) {
  return (
    <div className="w-full border-t border-stroke-base py-4">
      <div className="flex items-start gap-2">
        <div className="w-1/5">
          <div className="text-sm text-content-accent font-bold">
            <FormattedTime time={group.date} format="long-date" />
          </div>
          <div className="text-content-dimmed text-sm">{Time.relativeDay(group.date)}</div>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          {group.activities.map((activity) => (
            <ErrorBoundary key={activity.id} fallback={<div>{activity.action}</div>}>
              <ActivityItem key={activity.id} activity={activity} page={page} />
            </ErrorBoundary>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ activity, page }: { activity: Activities.Activity; page: string }) {
  return (
    <Container
      title={<ActivityHandler.FeedItemTitle activity={activity} page={page} />}
      author={activity.author!}
      time={activity.insertedAt}
      content={<ActivityHandler.FeedItemContent activity={activity} page={page} />}
    />
  );
}

export interface ActivityGroup {
  date: Date;
  activities: Activity[];
}

export function groupByDate(activities: Activity[]): ActivityGroup[] {
  const groups: ActivityGroup[] = [];

  let currentGroup: ActivityGroup | null = null;

  for (const activity of activities) {
    const date = Time.parseISO(activity.insertedAt!);

    if (currentGroup === null || !Time.isSameDay(currentGroup.date, date)) {
      currentGroup = {
        date,
        activities: [],
      };

      groups.push(currentGroup);
    }

    currentGroup.activities.push(activity);
  }

  return groups;
}

interface ContainerProps {
  author: Person;
  time: any;
  title: JSX.Element | string;
  content?: JSX.Element | string;
}

function Container({ author, time, title, content }: ContainerProps) {
  const alignement = content ? "items-start" : "items-center";
  const profilePath = Paths.profilePath(author.id!);

  return (
    <div className={"flex flex-1 gap-3" + " " + alignement}>
      <DivLink to={profilePath}>
        <Avatar person={author!} size="small" />
      </DivLink>

      <div className="flex-1">
        <FeedTitle>{title}</FeedTitle>
        {content && <FeedContent>{content}</FeedContent>}
      </div>
      <FeedTime time={time} author={author} />
    </div>
  );
}

function FeedTime({ time, author }) {
  return (
    <div className="shrink-0 text-xs text-content-dimmed w-16 text-right">
      <FormattedTime time={time} format="time-only" timezone={author.timezone} />
    </div>
  );
}

function FeedTitle({ children }) {
  return <div className="text-sm w-full font-bold text-content-accent">{children}</div>;
}

function FeedContent({ children }) {
  return <div className="text-sm w-full mt-1">{children}</div>;
}
