defmodule OperatelyWeb.Api.Subscriptions.NewAgentMessage do
  use TurboConnect.Subscription

  def join(_name, payload, socket) do
    topic = payload["convoId"]

    {:ok, socket, [topic]}
  end

  def broadcast(convo_id) do
    convo_id = Operately.ShortUuid.encode!(convo_id)
    OperatelyWeb.ApiSocket.broadcast!("api:new_agent_message:#{convo_id}")
  end
end
