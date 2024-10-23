import { Socket } from "phoenix";
import * as React from "react";

type Payload = { [key: string]: any };

var socket: Socket | null = null;
var sharedHeaders: Payload = {};

function connect(): Socket {
  if (socket) return socket!;

  let newSocket = new Socket("/api/v2/subscriptions", { params: { token: window.appConfig.api.socketToken } });
  newSocket.connect();

  socket = newSocket;
  return newSocket;
}

export function setHeaders(headers: Payload) {
  sharedHeaders = headers;
}

export function useSubscription(channelName: string, callback: () => void, payload: Payload = {}) {
  React.useEffect(() => {
    let socket = connect();
    let data = { ...sharedHeaders, ...payload };
    const channel = socket.channel(channelName, data);

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
