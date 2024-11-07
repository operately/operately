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

type Page = "company" | "project" | "goal" | "space" | "profile";
type ScopeType = "company" | "project" | "goal" | "space" | "person";

export function useItemsQuery(scopeType: ScopeType, scopeId: string) {
  return Api.useGetActivities({
    scopeType: scopeType,
    scopeId: scopeId,
    actions: DISPLAYED_IN_FEED,
  });
}

interface FeedConfig {
  page: Page;
  hideTopBorder?: boolean;
  paddedGroups?: boolean;
}

interface FeedProps extends FeedConfig {
  items: Activity[];
  testId?: string;
}

const FEED_PROP_DEFAULTS = {
  hideTopBorder: false,
};

export function Feed(props: FeedProps) {
  props = { ...FEED_PROP_DEFAULTS, ...props };

  return (
    <ErrorBoundary fallback={<div>Ooops, something went wrong while loading the feed</div>}>
      <div className="w-full" data-test-id={props.testId}>
        {Activities.groupByDate(props.items).map((group, index) => (
          <ActivityGroup
            key={index}
            group={group}
            page={props.page}
            hideTopBorder={props.hideTopBorder}
            paddedGroups={props.paddedGroups}
          />
        ))}
      </div>
    </ErrorBoundary>
  );
}

function ActivityGroup(props: FeedConfig & { group: Activities.ActivityGroup }) {
  const className = classNames("w-full border-stroke-base flex items-start gap-2", {
    "border-t": !props.hideTopBorder,
    "not-first:border-t": props.hideTopBorder,
    "p-8": props.paddedGroups,
    "py-4": !props.paddedGroups,
  });

  return (
    <div className={className}>
      <ActivityGroupDate group={props.group} />
      <ActivityGroupItems group={props.group} page={props.page} />
    </div>
  );
}

function ActivityGroupDate({ group }: { group: Activities.ActivityGroup }) {
  return (
    <div className="w-1/5 shrink-0">
      <div className="text-sm text-content-accent font-bold">
        <FormattedTime time={group.date} format="long-date" />
      </div>
      <div className="text-content-dimmed text-sm">{Time.relativeDay(group.date)}</div>
    </div>
  );
}

function ActivityGroupItems({ group, page }: { group: Activities.ActivityGroup; page: string }) {
  return (
    <div className="flex-1 flex flex-col gap-4">
      {group.activities.map((activity) => (
        <ErrorBoundary key={activity.id} fallback={<div>{activity.action}</div>}>
          <ActivityItem key={activity.id} activity={activity} page={page} />
        </ErrorBoundary>
      ))}
    </div>
  );
}

function ActivityItem({ activity, page }: { activity: Activities.Activity; page: string }) {
  const author = activity.author!;
  const time = activity.insertedAt!;
  const title = <ActivityHandler.FeedItemTitle activity={activity} page={page} />;
  const content = <ActivityHandler.FeedItemContent activity={activity} page={page} />;
  const alignement = ActivityHandler.feedItemAlignment(activity);
  const profilePath = Paths.profilePath(author.id!);

  return (
    <div className={classNames("flex flex-1 gap-3", alignement)}>
      <DivLink to={profilePath}>
        <Avatar person={author!} size="small" />
      </DivLink>

      <div className="w-full break-all -mt-0.5">
        <div className="text-sm font-bold text-content-accent">{title}</div>
        {content && <div className="text-sm w-full mt-0.5">{content}</div>}
      </div>

      <div className="shrink-0 text-xs text-content-dimmed w-16 text-right">
        <FormattedTime time={time} format="time-only" />
      </div>
    </div>
  );
}
