defmodule Operately.Search.Sources.ResourceHub.AncestorVisibility do
  @moduledoc """
  Identifies resource-hub nodes hidden by a deleted, missing, or invalid ancestor folder.

  The returned IDs only mark resources as ineligible for search. This module never
  deletes the original resources; search synchronization may remove their index entries.
  """

  import Ecto.Query

  alias Operately.Repo
  alias Operately.ResourceHubs.{Folder, Node}
  alias Operately.Search.Source

  def hidden_node_ids(nodes) do
    {folders, folder_nodes} = load_ancestor_graph(nodes)

    nodes
    |> Enum.filter(&hidden?(&1.parent_folder_id, folders, folder_nodes, MapSet.new()))
    |> MapSet.new(& &1.id)
  end

  defp load_ancestor_graph(nodes) do
    initial_ids = nodes |> Enum.map(& &1.parent_folder_id) |> Enum.reject(&is_nil/1) |> MapSet.new()
    load_ancestor_graph(initial_ids, MapSet.new(), %{}, %{})
  end

  defp load_ancestor_graph(frontier, visited, folders, folder_nodes) do
    ids = MapSet.difference(frontier, visited) |> MapSet.to_list()

    if ids == [] do
      {folders, folder_nodes}
    else
      loaded_folders = lock_folders(ids)
      loaded_nodes = lock_nodes(Enum.map(loaded_folders, & &1.node_id))
      next_ids = loaded_nodes |> Enum.map(& &1.parent_folder_id) |> Enum.reject(&is_nil/1) |> MapSet.new()

      load_ancestor_graph(
        next_ids,
        MapSet.union(visited, MapSet.new(ids)),
        Map.merge(folders, Map.new(loaded_folders, &{&1.id, &1})),
        Map.merge(folder_nodes, Map.new(loaded_nodes, &{&1.id, &1}))
      )
    end
  end

  defp lock_folders([]), do: []

  defp lock_folders(ids) do
    Folder
    |> where([folder], folder.id in ^ids)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
  end

  defp lock_nodes([]), do: []

  defp lock_nodes(ids) do
    Node
    |> where([node], node.id in ^ids)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
  end

  defp hidden?(nil, _folders, _folder_nodes, _visited), do: false

  defp hidden?(folder_id, folders, folder_nodes, visited) do
    if MapSet.member?(visited, folder_id) do
      true
    else
      case Map.get(folders, folder_id) do
        nil -> true
        %{deleted_at: deleted_at} when not is_nil(deleted_at) -> true
        folder -> hidden_through_node?(folder.node_id, folders, folder_nodes, MapSet.put(visited, folder_id))
      end
    end
  end

  defp hidden_through_node?(node_id, folders, folder_nodes, visited) do
    case Map.get(folder_nodes, node_id) do
      nil -> true
      %{deleted_at: deleted_at} when not is_nil(deleted_at) -> true
      node -> hidden?(node.parent_folder_id, folders, folder_nodes, visited)
    end
  end
end
