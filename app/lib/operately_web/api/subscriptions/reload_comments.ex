defmodule OperatelyWeb.Api.Subscriptions.ReloadComments do
  use TurboConnect.Subscription
  use OperatelyWeb.Api.Helpers

  def join(_name, payload, socket) do
    {:ok, resource_id} = decode_id(payload["resourceId"])

    {:ok, socket, [resource_id]}
  end
end
