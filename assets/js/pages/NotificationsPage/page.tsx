import * as React from "react";
import * as Paper from "@/components/PaperContainer";

import { useLoadedData } from "./loader";
import { useDocumentTitle } from "@/layouts/header";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";
import { TextSeparator } from "@/components/TextSeparator";
import { Spacer } from "@/components/Spacer";

import * as Icons from "@tabler/icons-react";

export function Page() {
  useDocumentTitle("Notifications");

  return (
    <Paper.Root>
      <Paper.Body>
        <UnreadNotifications />
        <Spacer size={4} />
        <PreviousNotifications />
      </Paper.Body>
    </Paper.Root>
  );
}

function UnreadNotifications() {
  const { notifications } = useLoadedData();

  const unread = notifications.filter((n) => !n.read);

  return (
    <div>
      <div className="text-orange-500 font-bold">New</div>
      {unread.map((n) => (
        <Notification key={n.id} notification={n} />
      ))}
    </div>
  );
}

function PreviousNotifications() {
  const { notifications } = useLoadedData();

  const previouslyRead = notifications.filter((n) => n.read);

  return (
    <div>
      <div className="text-white-1 font-bold mb-2">Previous Notifications</div>
      {previouslyRead.map((n) => (
        <Notification key={n.id} notification={n} />
      ))}
    </div>
  );
}

function Notification({ notification }) {
  return (
    <div className="flex items-center gap-3 hover:bg-shade-1 rounded p-1 group transition-all duration-100 cursor-pointer mb-1">
      <div className="shrink-0">
        <Avatar person={notification.activity.author} size={36} />
      </div>

      <div className="flex-1">
        <div className="text-white-1 font-semibold">Igor started a new discussion: How to use Operately?</div>
        <div className="text-white-2 text-sm leading-snug">
          Operately Alpha
          <TextSeparator />
          {notification.activity.author.fullName}
          <TextSeparator />
          <FormattedTime time={notification.activity.insertedAt} format="long-date" />
        </div>
      </div>

      <div className="shrink-0 group-hover:opacity-100 opacity-0 cursor-pointer mb-4 mr-1">
        <Icons.IconX size={16} className="hover:text-white-1" />
      </div>
    </div>
  );
}
