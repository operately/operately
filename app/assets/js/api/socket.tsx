import { Socket } from "phoenix";
import * as React from "react";
import { getSupportSessionCookie } from "../features/SupportSessions";

type Payload = { [key: string]: any };

var socket: Socket | null = null;
var sharedHeaders: Payload = {};
const EMPTY_PAYLOAD: Payload = {};

function connect(): Socket {
  if (socket) return socket;

  const params = {
    token: window.appConfig.api.socketToken,
    support_session_token: getSupportSessionCookie(),
  };

  let newSocket = new Socket("/api/v2/subscriptions", { params });
  newSocket.connect();

  socket = newSocket;
  return newSocket;
}

export function setHeaders(headers: Payload) {
  sharedHeaders = headers;
}

export function useSubscription(
  channelName: string,
  callback: () => void,
  payload: Payload = EMPTY_PAYLOAD,
  onJoined?: () => void,
) {
  const callbacks = React.useRef({ callback, onJoined });
  callbacks.current = { callback, onJoined };
  const headers = sharedHeaders;

  React.useEffect(() => {
    let socket = connect();
    let data = { ...headers, ...payload };
    const channel = socket.channel(channelName, data);

    const binding = channel.on("event", () => callbacks.current.callback());

    channel
      .join()
      .receive("ok", () => callbacks.current.onJoined?.())
      .receive("error", (resp: string) => {
        console.log("Unable to subscribe", resp);
      });

    return () => {
      channel.off("event", binding);
      channel.leave();
    };
  }, [channelName, payload, headers]);
}
