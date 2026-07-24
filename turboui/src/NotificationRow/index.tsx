import React from "react";
import { Avatar, type AvatarPerson } from "../Avatar";
import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import { IconCheck } from "../icons";
import { TextSeparator } from "../TextSeparator";

export interface NotificationRowProps {
  author: AvatarPerson;
  title: React.ReactNode;
  location: React.ReactNode;
  insertedAt: string;
  formattedTimePreferences: FormattedTimePreferences;
  read: boolean;
  testId: string;
  onOpen: () => void;
  onMarkAsRead: () => void;
}

export function NotificationRow({
  author,
  title,
  location,
  insertedAt,
  formattedTimePreferences,
  read,
  testId,
  onOpen,
  onMarkAsRead,
}: NotificationRowProps) {
  const handleMarkAsRead = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onMarkAsRead();
  };

  return (
    <div
      className="relative flex items-center gap-3 hover:bg-surface-highlight rounded p-1 group transition-all duration-100 cursor-pointer mb-1"
      onClick={onOpen}
      data-test-id={testId}
    >
      <div className="shrink-0">
        <Avatar person={author} size="small" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-content-accent font-semibold">{title}</div>

        <div className="text-content-dimmed font-medium text-sm leading-snug">
          {location}
          <TextSeparator />
          {author.fullName}
          <TextSeparator />
          <FormattedTime {...formattedTimePreferences} time={insertedAt} format="long-date" />
        </div>
      </div>

      {!read && (
        <button
          type="button"
          aria-label="Mark as read"
          title="Mark as read"
          className="absolute -right-8 -top-1 rounded group-hover:opacity-100 focus:opacity-100 opacity-0 cursor-pointer p-2"
          data-test-id={`${testId}-mark-as-read`}
          onClick={handleMarkAsRead}
        >
          <IconCheck size={16} className="hover:text-content-accent" />
        </button>
      )}
    </div>
  );
}
