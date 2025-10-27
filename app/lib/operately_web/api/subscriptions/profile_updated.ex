defmodule OperatelyWeb.Api.Subscriptions.ProfileUpdated do
  use TurboConnect.Subscription

  def join(_name, _payload, socket) do
    topic = socket.assigns.person.id

    {:ok, socket, [topic]}
  end

  def broadcast(person_id: person_id) do
    OperatelyWeb.ApiSocket.broadcast!("api:profile_updated:#{person_id}")
  end
end
