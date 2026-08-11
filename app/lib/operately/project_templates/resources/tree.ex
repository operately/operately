defmodule Operately.ProjectTemplates.Resources.Tree do
  @moduledoc """
  Provides pure helpers for copying hierarchical template resources.

  It orders nodes so parent folders are copied before their children and keeps
  the source-to-destination folder ID map used to rebuild parent relationships.
  """

  def sort_by_depth(nodes), do: Enum.sort_by(nodes, &depth(&1, nodes))

  def remapped_parent_id!(%{parent_folder_id: nil}, _folder_ids), do: nil
  def remapped_parent_id!(source, folder_ids), do: Map.fetch!(folder_ids, source.parent_folder_id)

  def remember_folder_id(folder_ids, %{type: :folder, folder: folder}, copied_folder),
    do: Map.put(folder_ids, folder.id, copied_folder.id)

  def remember_folder_id(folder_ids, _source, _copied_content), do: folder_ids

  def folder_node?(%{type: :folder, folder: folder}) when not is_nil(folder), do: true
  def folder_node?(_node), do: false

  defp depth(node, all_nodes), do: depth(node.parent_folder_id, all_nodes, 0)
  defp depth(nil, _all_nodes, depth), do: depth

  defp depth(folder_id, all_nodes, depth) do
    case Enum.find(all_nodes, &(&1.folder && &1.folder.id == folder_id)) do
      nil -> depth
      folder_node -> depth(folder_node.parent_folder_id, all_nodes, depth + 1)
    end
  end
end
