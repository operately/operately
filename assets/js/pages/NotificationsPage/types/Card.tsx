import * as React from "react";
import * as Icons from "@tabler/icons-react";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { TextSeparator } from "@/components/TextSeparator";

import { gql, useMutation } from "@apollo/client";
import { useRefresh } from "../loader";

export function Card({ notification, author, title, link, where, when, who }) {
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
      className="flex items-center gap-3 hover:bg-shade-1 rounded p-1 group transition-all duration-100 cursor-pointer mb-1"
      onClick={clickHandler}
      data-test-id="notification-card"
    >
      <div className="shrink-0">
        <Avatar person={author} size={36} />
      </div>

      <div className="flex-1">
        <div className="text-white-1 font-semibold">{title}</div>
        <div className="text-white-2 text-sm leading-snug">
          {where}
          <TextSeparator />
          {who}
          <TextSeparator />
          <FormattedTime time={when} format="long-date" />
        </div>
      </div>

      {notification.read ? null : (
        <div className="shrink-0 group-hover:opacity-100 opacity-0 cursor-pointer mb-4 mr-1" onClick={closeHandler}>
          <Icons.IconX size={16} className="hover:text-white-1" />
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
