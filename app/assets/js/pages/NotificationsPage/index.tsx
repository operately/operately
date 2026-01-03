import * as Api from "@/api";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Notifications from "@/models/notifications";
import * as Signals from "@/signals";
import { IconSparkles, IconX } from "turboui";
import * as React from "react";

import FormattedTime from "@/components/FormattedTime";
import ActivityHandler from "@/features/activities";
import { Avatar } from "turboui";

import { TextSeparator } from "@/components/TextSeparator";
import { PageModule } from "@/routes/types";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { SecondaryButton } from "turboui";
import { usePaths } from "../../routes/paths";

export default { name: "NotificationsPage", loader, Page } as PageModule;

interface LoaderResult {
  notifications: Api.Notification[];
}

async function loader(): Promise<LoaderResult> {
  const data = await Api.getNotifications({
    page: 1,
    perPage: 100,
  });

  return {
    notifications: data.notifications as Api.Notification[],
  };
}

function Page() {
  const onLoad = () => Signals.publish(Signals.LocalSignal.RefreshNotificationCount);

  return (
    <Pages.Page title="Notifications" onLoad={onLoad}>
      <Paper.Root size="medium">
        <Paper.Body className="relative flex flex-col items-stretch">
          <h1 className="text-2xl font-bold text-center">Notifications</h1>
          <div className="text-center text-sm">Here's every notification you've received from Operately.</div>

          <UnreadNotifications />
          <PreviousNotifications />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function UnreadNotifications() {
  const { notifications } = Pages.useLoadedData<LoaderResult>();

  const unread = notifications.filter((n) => !n.read!);

  return (
    <div className="pt-2" style={{ minHeight: "200px" }}>
      <div className="flex items-center gap-4 mb-3">
        <div className="text-sm uppercase font-extrabold text-orange-500">New for you</div>
        <div className="h-px bg-stroke-base flex-1" />
        {unread.length > 0 && <MarkAllReadButton />}
      </div>

      {unread.length === 0 && (
        <div className="px-12 pt-16 py-20 text-content-accent font-medium flex items-center flex-col gap-2">
          <IconSparkles className="text-yellow-500" />
          Nothing new for you.
        </div>
      )}

      {unread.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </div>
  );
}

function MarkAllReadButton() {
  const refresh = Pages.useRefresh();
  const [markAllRead, { loading }] = Notifications.useMarkAllNotificationsAsRead();

  const onClick = React.useCallback(async () => {
    await markAllRead({});
    refresh();
  }, [markAllRead]);

  return (
    <SecondaryButton size="xs" testId="mark-all-read" onClick={onClick} loading={loading}>
      Mark all read
    </SecondaryButton>
  );
}

function PreviousNotifications() {
  const { notifications } = Pages.useLoadedData<LoaderResult>();

  const previouslyRead = notifications.filter((n) => n.read);

  return (
    <Paper.DimmedSection>
      <div className="text-content-accent font-bold mb-2">Previous Notifications</div>
      {previouslyRead.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </Paper.DimmedSection>
  );
}

function NotificationItem({ notification }: any) {
  const paths = usePaths();
  const author = notification.activity.author;
  const testId = "notification-item" + "-" + notification.activity.action;

  const goToActivity = useNavigateTo(ActivityHandler.pagePath(paths, notification.activity));
  const [mark] = Notifications.useMarkNotificationAsRead();
  const refresh = Pages.useRefresh();

  const clickHandler = React.useCallback(async () => {
    await mark({ id: notification.id });
    goToActivity();
  }, []);

  const closeHandler = React.useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await mark({ id: notification.id });
    refresh();
  }, []);

  return (
    <div
      className="relative flex items-center gap-3 hover:bg-surface-highlight rounded p-1 group transition-all duration-100 cursor-pointer mb-1"
      onClick={clickHandler}
      data-test-id={testId}
    >
      <div className="shrink-0">
        <Avatar person={author} size="small" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-content-accent font-semibold">
          <ActivityHandler.NotificationTitle activity={notification.activity} />
        </div>

        <div className="text-content-dimmed font-medium text-sm leading-snug">
          <ActivityHandler.NotificationLocation activity={notification.activity} />
          <TextSeparator />
          {author.fullName}
          <TextSeparator />
          <FormattedTime time={notification.activity.insertedAt} format="long-date" />
        </div>
      </div>

      {notification.read ? null : (
        <div className="absolute -right-8 -top-1 rounded group-hover:opacity-100 opacity-0 cursor-pointer p-2" onClick={closeHandler}>
          <IconX size={16} className="hover:text-content-accent" />
        </div>
      )}
    </div>
  );
}
