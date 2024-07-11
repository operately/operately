defmodule OperatelyWeb.Api.Subscriptions.UnreadNotificationsCount do
  use TurboConnect.Subscription

  def join(_name, _payload, socket) do
    topic = socket.assigns.account.person.id

    {:ok, socket, [topic]}
  end

end
