import * as React from "react";
import * as Icons from "@tabler/icons-react";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { TextSeparator } from "@/components/TextSeparator";

import { gql, useMutation } from "@apollo/client";
import { useRefresh } from "./loader";

export function Card({ notification, author, title, link, where, when, who, testId }: any) {
  const goToActivity = useNavigateTo(link);
  const [mark] = useMarkAsRead();
  const refresh = useRefresh();

  const clickHandler = React.useCallback(async () => {
    await mark({ variables: { id: notification.id } });
    goToActivity();
  }, [link]);

  const closeHandler = React.useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    await mark({ variables: { id: notification.id } });

    refresh();
  }, []);

  return (
    <div
      className="flex items-center gap-3 hover:bg-surface-highlight rounded p-1 group transition-all duration-100 cursor-pointer mb-1"
      onClick={clickHandler}
      data-test-id={testId || "notification-card"}
    >
      <div className="shrink-0">
        <Avatar person={author} size="small" />
      </div>

      <div className="flex-1">
        <div className="text-content-accent font-semibold">{title}</div>
        <div className="text-content-dimmed font-medium text-sm leading-snug">
          {where}
          <TextSeparator />
          {who}
          <TextSeparator />
          <FormattedTime timezone={""} time={when} format="long-date" />
        </div>
      </div>

      {notification.read ? null : (
        <div className="shrink-0 group-hover:opacity-100 opacity-0 cursor-pointer mb-4 mr-1" onClick={closeHandler}>
          <Icons.IconX size={16} className="hover:text-content-accent" />
        </div>
      )}
    </div>
  );
}

function useMarkAsRead() {
  return useMutation(gql`
    mutation MarkNotificationAsRead($id: ID!) {
      markNotificationAsRead(id: $id) {
        id
      }
    }
  `);
}
