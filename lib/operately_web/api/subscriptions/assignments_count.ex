defmodule OperatelyWeb.Api.Subscriptions.AssignmentsCount do
  use TurboConnect.Subscription

  def join(_name, _payload, socket) do
    topic = socket.assigns.account.person.id

    {:ok, socket, [topic]}
  end

end
