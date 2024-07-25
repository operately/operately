import { Socket } from "phoenix";
import * as React from "react";

type Payload = {[ key: string ]: any};

var socket: Socket | null = null;

function connect(): Socket {
  if (socket) return socket!;

  let newSocket = new Socket("/api/v2/subscriptions", { params: { token: window.appConfig.api.socketToken } });
  newSocket.connect();

  socket = newSocket;
  return newSocket;
}

function useSubscription(channelName: string, callback: () => void, payload: Payload={}) {
  React.useEffect(() => {
    let socket = connect();
    const channel = socket.channel(channelName, payload);

    channel.on("event", callback);

    channel
      .join()
      .receive("ok", () => {})
      .receive("error", (resp: string) => {
        console.log("Unable to subscribe", resp);
      });

    return () => {
      channel.off("event", callback);
      channel.leave();
    };
  }, [channelName, callback]);
}

export function useAssignmentsCount(callback: () => void) {
  return useSubscription("api:assignments_count", callback);
}

export function useDiscussionCommentsChangeSignal(callback: () => void, payload: { discussionId: string }) {
  return useSubscription("api:discussion_comments", callback, payload);
}

export function useUnreadNotificationCount(callback: () => void) {
  return useSubscription("api:unread_notifications_count", callback);
}
