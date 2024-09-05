defmodule OperatelyWeb.Api.Mutations.UnsubscribeFromNotifications do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Operations.NotificationsUnsubscribing

  inputs do
    field :id, :string
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.id) end)
    |> run(:operation, fn ctx -> NotificationsUnsubscribing.run(ctx.me.id, ctx.id) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, _} -> {:ok, %{}}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
