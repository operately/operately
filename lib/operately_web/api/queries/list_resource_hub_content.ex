defmodule OperatelyWeb.Api.Queries.ListResourceHubContent do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.Node
  alias Operately.Access.Filters

  inputs do
    field :resource_hub_id, :string
    field :parent_folder_id, :string
  end

  outputs do
    field :nodes, list_of(:resource_hub_node )
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:nodes, fn ctx -> load_nodes(ctx) end)
    |> run(:serialized, fn ctx -> serialize(ctx) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :nodes, _} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load_nodes(ctx) do
    nodes =
      query(ctx.attrs)
      |> Filters.filter_by_view_access(ctx.me.id, join_parent: :resource_hub)
      |> Repo.all()

    {:ok, nodes}
  end

  defp serialize(ctx) do
    {:ok, %{nodes: Serializer.serialize(ctx.nodes)}}
  end

  defp query(%{parent_folder_id: id}) do
    from(n in Node, where: n.parent_folder_id == ^id)
  end
  defp query(%{resource_hub_id: id}) do
    from(n in Node, where: n.resource_hub_id == ^id)
  end

  defp parse_inputs(inputs) do
    if Map.has_key?(inputs, :parent_folder_id) do
      {:ok, id} = decode_id(inputs.parent_folder_id)
      {:ok, %{parent_folder_id: id}}
    else
      {:ok, id} = decode_id(inputs.resource_hub_id)
      {:ok, %{resource_hub_id: id}}
    end
  end
end
