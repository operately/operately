defmodule Operately.Search.Sources.ResourceHub.Loader do
  @moduledoc false

  import Ecto.Query

  alias Operately.Repo
  alias Operately.ResourceHubs.Node
  alias Operately.Search.Source
  alias Operately.Search.Sources.ResourceHub.{AncestorVisibility, Metadata, Record}

  def fetch_batch(schema, cursor, limit) do
    schema
    |> after_cursor(cursor)
    |> order_by([resource], asc: resource.id)
    |> limit(^limit)
    |> Source.lock_for_maintenance()
    |> Repo.all()
    |> hydrate()
  end

  def fetch_by_ids(_schema, []), do: {:ok, []}

  def fetch_by_ids(schema, ids) do
    schema
    |> where([resource], resource.id in ^ids)
    |> order_by([resource], asc: resource.id)
    |> Source.lock_for_maintenance()
    |> Repo.all()
    |> hydrate()
  end

  defp hydrate(resources) do
    nodes = load_nodes(resources)
    nodes_by_id = Map.new(nodes, &{&1.id, &1})
    metadata = nodes |> Enum.map(& &1.resource_hub_id) |> Metadata.load()
    hidden_node_ids = AncestorVisibility.hidden_node_ids(nodes)

    records =
      Enum.map(resources, fn resource ->
        node = Map.get(nodes_by_id, resource.node_id)
        scope = node && Map.get(metadata, node.resource_hub_id)

        %Record{
          id: resource.id,
          resource: resource,
          node: node,
          company_id: scope && scope.company_id,
          access_context_id: scope && scope.access_context_id,
          resource_hub_id: scope && scope.resource_hub_id,
          space_id: scope && scope.space_id,
          project_id: scope && scope.project_id,
          goal_id: scope && scope.goal_id,
          scope_updated_at: scope && scope.scope_updated_at,
          owning_parent_deleted?: is_nil(scope) or scope.owning_parent_deleted?,
          hidden_by_deleted_folder?: node && MapSet.member?(hidden_node_ids, node.id)
        }
      end)

    {:ok, records}
  end

  defp load_nodes(resources) do
    node_ids = Enum.map(resources, & &1.node_id)

    Node
    |> where([node], node.id in ^node_ids)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
  end

  defp after_cursor(query, nil), do: query
  defp after_cursor(query, cursor), do: where(query, [resource], resource.id > ^cursor)
end
