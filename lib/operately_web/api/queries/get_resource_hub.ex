defmodule OperatelyWeb.Api.Queries.GetResourceHub do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.ResourceHub

  inputs do
    field :id, :string
  end

  outputs do
    field :resource_hub, :resource_hub
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.id) end)
    |> run(:hub, fn ctx -> ResourceHub.get(ctx.me, id: ctx.id, opts: [preload: :nodes]) end)
    |> run(:serialized, fn ctx -> {:ok, %{resource_hub: Serializer.serialize(ctx.hub)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :hub, _} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end
end
