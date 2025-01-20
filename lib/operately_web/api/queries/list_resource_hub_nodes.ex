defmodule OperatelyWeb.Api.Queries.ListResourceHubNodes do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{Node, Folder}
  alias Operately.Access.Filters

  inputs do
    field :resource_hub_id, :id
    field :folder_id, :id
    field :include_comments_count, :boolean
    field :include_children_count, :boolean
  end

  outputs do
    field :nodes, list_of(:resource_hub_node)
    field :draft_nodes, list_of(:resource_hub_node)
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:nodes, fn ctx -> load_nodes(ctx.me, inputs) end)
    |> run(:serialized, fn ctx -> serialize(ctx.nodes) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :nodes, _} -> {:error, :not_found}
      {:error, :bad_request, message} -> {:error, :bad_request, message}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load_nodes(me, inputs) do
    nodes =
      from(n in Node, order_by: [desc: n.inserted_at])
      |> filter_nodes(inputs)
      |> Node.preload_content(me)
      |> Filters.filter_by_view_access(me.id)
      |> Repo.all()
      |> load_comments_count(inputs[:include_comments_count])
      |> set_folders_children_count(inputs[:include_children_count])

    {:ok, nodes}
  end

  defp serialize(nodes) do
    {drafts, published} = Node.separate_drafts(nodes)

    {:ok, %{
      nodes: Serializer.serialize(published, level: :essential),
      draft_nodes: Serializer.serialize(drafts, level: :essential)
    }}
  end

  defp filter_nodes(q, %{resource_hub_id: resource_hub_id}) do
    from(n in q, where: n.resource_hub_id == ^resource_hub_id and is_nil(n.parent_folder_id))
  end
  defp filter_nodes(q, %{folder_id: folder_id}) do
    from(n in q, where: n.parent_folder_id == ^folder_id)
  end

  defp load_comments_count(nodes, true), do: Node.load_comments_count(nodes)
  defp load_comments_count(nodes, _), do: nodes

  defp set_folders_children_count(nodes, true), do: Folder.set_children_count(nodes)
  defp set_folders_children_count(nodes, _), do: nodes
end
