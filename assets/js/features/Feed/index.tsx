import * as React from "react";
import * as Time from "@/utils/time";
import * as Activities from "@/models/activities";

import { Activity } from "@/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";

import Avatar from "@/components/Avatar";
import classNames from "classnames";
import ActivityHandler, { DISPLAYED_IN_FEED } from "@/features/activities";
import FormattedTime from "@/components/FormattedTime";
import Api from "@/api";

export type Page = "company" | "project" | "goal" | "space" | "profile";

type ScopeType = "company" | "project" | "goal" | "space" | "person";

export function useItemsQuery(scopeType: ScopeType, scopeId: string) {
  return Api.useGetActivities({
    scopeType: scopeType,
    scopeId: scopeId,
    actions: DISPLAYED_IN_FEED,
  });
}

export function Feed({ items, testId, page }: { items: Activity[]; testId?: string; page: Page }) {
  return (
    <ErrorBoundary fallback={<div>Ooops, something went wrong while loading the feed</div>}>
      <div className="w-full" data-test-id={testId}>
        {Activities.groupByDate(items).map((group, index) => (
          <ActivityGroup key={index} group={group} page={page} />
        ))}
      </div>
    </ErrorBoundary>
  );
}

function ActivityGroup({ group, page }: { group: Activities.ActivityGroup; page: string }) {
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
  const author = activity.author!;
  const time = activity.insertedAt!;
  const title = <ActivityHandler.FeedItemTitle activity={activity} page={page} />;
  const content = <ActivityHandler.FeedItemContent activity={activity} page={page} />;
  const alignement = content ? "items-start" : "items-center";
  const profilePath = Paths.profilePath(author.id!);

  return (
    <div className={classNames("flex flex-1 gap-3", alignement)}>
      <DivLink to={profilePath}>
        <Avatar person={author!} size="small" />
      </DivLink>

      <div className="flex-1">
        <div className="text-sm w-full font-bold text-content-accent">{title}</div>
        {content && <div className="text-sm w-full mt-1">{content}</div>}
      </div>

      <div className="shrink-0 text-xs text-content-dimmed w-16 text-right">
        <FormattedTime time={time} format="time-only" timezone={author.timezone!} />
      </div>
    </div>
  );
}
