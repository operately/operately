defmodule OperatelyWeb.Api.Subscriptions.BillingUpdated do
  use TurboConnect.Subscription

  def join(_name, _payload, socket) do
    {:ok, socket, [socket.assigns.company.id]}
  end

  def broadcast(company_id: company_id) do
    OperatelyWeb.ApiSocket.broadcast!("api:billing_updated:#{company_id}")
  end
end
