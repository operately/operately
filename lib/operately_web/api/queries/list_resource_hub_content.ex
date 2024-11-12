defmodule OperatelyWeb.Api.Queries.ListResourceHubContent do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.Node
  alias Operately.Access.Filters

  inputs do
    field :resource_hub_id, :string
  end

  outputs do
    field :nodes, list_of(:task)
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.resource_hub_id) end)
    |> run(:nodes, fn ctx -> load_nodes(ctx) end)
    |> run(:serialized, fn ctx -> serialize(ctx) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :nodes, _} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load_nodes(ctx) do
    nodes =
      from(n in Node, where: n.resource_hub_id == ^ctx.id)
      |> Filters.filter_by_view_access(ctx.me.id, join_parent: :resource_hub)
      |> Repo.all()

    {:ok, nodes}
  end

  defp serialize(ctx) do
    {:ok, %{nodes: Serializer.serialize(ctx.nodes)}}
  end
end
