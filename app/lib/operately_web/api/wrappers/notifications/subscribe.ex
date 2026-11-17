defmodule OperatelyWeb.Api.Wrappers.Notifications.Subscribe do
  @moduledoc "Subscribes the current user using a resource ID and type."

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.Wrappers.Notifications.ResourceSubscription

  inputs do
    field :resource_id, :id, null: false
    field :resource_type, :subscription_parent_type, null: false
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, list_id} <- ResourceSubscription.resolve(me, inputs) do
      OperatelyWeb.Api.Notifications.Subscribe.call(conn, %{subscription_list_id: list_id, type: inputs.resource_type})
    end
  end
end
