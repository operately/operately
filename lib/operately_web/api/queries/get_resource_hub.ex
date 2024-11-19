defmodule OperatelyWeb.Api.Queries.GetResourceHub do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.ResourceHub

  inputs do
    field :id, :id
    field :include_space, :boolean
    field :include_nodes, :boolean
  end

  outputs do
    field :resource_hub, :resource_hub
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:hub, fn ctx -> load(ctx, inputs) end)
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

  def load(ctx, inputs) do
    ResourceHub.get(ctx.me, id: inputs.id, opts: [
      preload: preload(inputs),
    ])
  end

  def preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_space: :space,
      include_nodes: [nodes: [[folder: :node], [document: :node]]],
    ])
  end
end
