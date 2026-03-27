defmodule OperatelyWeb.Api.Notifications.Unsubscribe do
  @moduledoc """
  Unsubscribes the current user from notifications for a specific subscription list.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Operations.NotificationsUnsubscribing

  inputs do
    field :subscription_list_id, :id, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:operation, fn ctx -> NotificationsUnsubscribing.run(ctx.me.id, inputs.subscription_list_id) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, _} -> {:ok, %{}}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
