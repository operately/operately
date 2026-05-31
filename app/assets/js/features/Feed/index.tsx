import * as Activities from "@/models/activities";
import * as Time from "@/utils/time";
import * as React from "react";

import { Activity } from "@/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConfirmDialog, DivLink, IconDots, IconTrash, Menu, MenuActionItem } from "turboui";

import Api from "@/api";
import FormattedTime from "@/components/FormattedTime";
import ActivityHandler, { DISPLAYED_IN_FEED } from "@/features/activities";
import { FeedZeroState } from "@/features/Feed/FeedZeroState";
import classNames from "classnames";
import { Avatar } from "turboui";

import { usePaths } from "@/routes/paths";
type Page = "company" | "project" | "goal" | "space" | "profile";
type ScopeType = "company" | "project" | "goal" | "space" | "person";

export function useItemsQuery(scopeType: ScopeType, scopeId: string) {
  return Api.companies.useListActivities({
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
  canDeleteItems?: boolean;
  onDeleteItem?: (activity: Activity) => Promise<void> | void;
}

const FEED_PROP_DEFAULTS = {
  hideTopBorder: false,
};

export function Feed(props: FeedProps) {
  props = { ...FEED_PROP_DEFAULTS, ...props };
  const items = Activities.aggregateConsecutiveFeedActivities(props.items);
  const groupedActivities = Activities.groupByDate(items);
  const [activityToDelete, setActivityToDelete] = React.useState<Activity | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleConfirmDelete = async () => {
    if (!activityToDelete || !props.onDeleteItem || deleting) return;

    setDeleting(true);

    try {
      await props.onDeleteItem(activityToDelete);
      setActivityToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ErrorBoundary fallback={<div>Ooops, something went wrong while loading the feed</div>}>
      <div className="w-full" data-test-id={props.testId}>
        {groupedActivities.length === 0 ? (
          <FeedZeroState page={props.page} />
        ) : (
          groupedActivities.map((group, index) => (
            <ActivityGroup
              key={index}
              group={group}
              page={props.page}
              hideTopBorder={props.hideTopBorder}
              paddedGroups={props.paddedGroups}
              canDeleteItems={props.canDeleteItems}
              onDeleteItem={setActivityToDelete}
            />
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={!!activityToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setActivityToDelete(null)}
        title="Delete feed item"
        message="This removes the item from the company feed. The underlying project, goal, task, or document will not be deleted."
        confirmText="Delete"
        variant="danger"
        testId="delete-feed-activity-dialog"
      />
    </ErrorBoundary>
  );
}

function ActivityGroup(
  props: FeedConfig & {
    group: Activities.ActivityGroup;
    canDeleteItems?: boolean;
    onDeleteItem?: (activity: Activity) => void;
  },
) {
  const className = classNames("w-full border-stroke-base flex flex-col sm:flex-row items-start gap-2", {
    "border-t": !props.hideTopBorder,
    "not-first:border-t": props.hideTopBorder,
    "p-8": props.paddedGroups,
    "py-4": !props.paddedGroups,
  });

  return (
    <div className={className}>
      <ActivityGroupDate group={props.group} />
      <ActivityGroupItems
        group={props.group}
        page={props.page}
        canDeleteItems={props.canDeleteItems}
        onDeleteItem={props.onDeleteItem}
      />
    </div>
  );
}

function ActivityGroupDate({ group }: { group: Activities.ActivityGroup }) {
  return (
    <div className="w-1/5 shrink-0 mb-2">
      <div className="text-sm text-content-accent font-bold whitespace-nowrap">
        <FormattedTime time={group.date} format="long-date" />
      </div>
      <div className="whitespace-nowrap text-content-dimmed text-sm">{Time.relativeDay(group.date)}</div>
    </div>
  );
}

function ActivityGroupItems({
  group,
  page,
  canDeleteItems,
  onDeleteItem,
}: {
  group: Activities.ActivityGroup;
  page: string;
  canDeleteItems?: boolean;
  onDeleteItem?: (activity: Activity) => void;
}) {
  return (
    <div className="flex-1 flex flex-col gap-4">
      {group.activities.map((activity) => (
        <ErrorBoundary key={activity.id} fallback={<div>{activity.action}</div>}>
          <ActivityItem
            key={activity.id}
            activity={activity}
            page={page}
            canDeleteItem={canDeleteItems}
            onDeleteItem={onDeleteItem}
          />
        </ErrorBoundary>
      ))}
    </div>
  );
}

function ActivityItem({
  activity,
  page,
  canDeleteItem,
  onDeleteItem,
}: {
  activity: Activities.Activity;
  page: string;
  canDeleteItem?: boolean;
  onDeleteItem?: (activity: Activity) => void;
}) {
  const paths = usePaths();
  const author = activity.author!;
  const time = activity.insertedAt!;
  const title = <ActivityHandler.FeedItemTitle activity={activity} page={page} />;
  const content = <ActivityHandler.FeedItemContent activity={activity} page={page} />;
  const alignement = ActivityHandler.feedItemAlignment(activity);
  const profilePath = paths.profilePath(author.id!);

  return (
    <div
      className={classNames("group flex flex-1 gap-3", alignement)}
      data-test-id="feed-activity-item"
      data-activity-id={activity.id}
    >
      <DivLink to={profilePath}>
        <Avatar person={author!} size="small" />
      </DivLink>

      <div className="w-full break-words -mt-0.5">
        <div className="text-sm font-bold text-content-accent">{title}</div>
        {content && <div className="text-sm w-full mt-0.5">{content}</div>}
      </div>

      <div className="shrink-0 flex items-center gap-1">
        <div className="text-xs text-content-dimmed whitespace-nowrap text-right">
          <FormattedTime time={time} format="time-only" />
        </div>

        {canDeleteItem && onDeleteItem && <ActivityItemOptions activity={activity} onDeleteItem={onDeleteItem} />}
      </div>
    </div>
  );
}

function ActivityItemOptions({
  activity,
  onDeleteItem,
}: {
  activity: Activities.Activity;
  onDeleteItem: (activity: Activity) => void;
}) {
  const triggerClassName = classNames(
    "w-7 flex justify-end opacity-100 pointer-events-auto transition-opacity",
    "sm:opacity-0 sm:pointer-events-none",
    "sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto",
    "sm:group-focus-within:opacity-100 sm:group-focus-within:pointer-events-auto",
  );

  return (
    <div className={triggerClassName}>
      <Menu
        size="tiny"
        align="end"
        testId="feed-activity-options"
        customTrigger={
          <button
            type="button"
            title="Feed item actions"
            aria-label="Feed item actions"
            className="w-6 h-6 flex items-center justify-center rounded-full text-content-dimmed hover:text-content-base hover:bg-surface-dimmed focus:text-content-base focus:bg-surface-dimmed focus:outline-none"
          >
            <IconDots size={16} />
          </button>
        }
      >
        <MenuActionItem onClick={() => onDeleteItem(activity)} testId="delete-feed-activity" icon={IconTrash} danger>
          Delete feed item
        </MenuActionItem>
      </Menu>
    </div>
  );
}
