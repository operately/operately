defmodule Operately.ProjectTemplates.Resources.Validator do
  alias Operately.ProjectTemplates.Resources.Tree

  def run(nodes) do
    folder_ids = nodes |> Enum.filter(&Tree.folder_node?/1) |> MapSet.new(& &1.folder.id)

    with :ok <- validate_node_content(nodes),
         :ok <- validate_parents(nodes, folder_ids),
         :ok <- validate_positions(nodes),
         :ok <- validate_acyclic_folders(nodes, folder_ids) do
      :ok
    end
  end

  defp validate_node_content(nodes) do
    if Enum.all?(nodes, &matches_node_type?/1), do: :ok, else: {:error, :invalid_resource_tree}
  end

  defp matches_node_type?(%{type: :folder, folder: folder}) when not is_nil(folder), do: true
  defp matches_node_type?(%{type: :document, document: document}) when not is_nil(document), do: true
  defp matches_node_type?(%{type: :file, file: file}) when not is_nil(file), do: true
  defp matches_node_type?(%{type: :link, link: link}) when not is_nil(link), do: true
  defp matches_node_type?(_node), do: false

  defp validate_parents(nodes, folder_ids) do
    if Enum.all?(nodes, fn node -> is_nil(node.parent_folder_id) or MapSet.member?(folder_ids, node.parent_folder_id) end),
      do: :ok,
      else: {:error, :invalid_resource_parent}
  end

  # Positions are scoped to a parent folder, so every sibling needs a unique,
  # non-negative position. Gaps are valid because editor operations normalize them.
  defp validate_positions(nodes) do
    valid? =
      nodes
      |> Enum.group_by(& &1.parent_folder_id)
      |> Enum.all?(fn {_parent_id, siblings} ->
        positions = Enum.map(siblings, & &1.position)
        Enum.all?(positions, &(is_integer(&1) and &1 >= 0)) and length(positions) == MapSet.size(MapSet.new(positions))
      end)

    if valid?, do: :ok, else: {:error, :invalid_resource_tree}
  end

  defp validate_acyclic_folders(nodes, folder_ids) do
    parents =
      nodes
      |> Enum.filter(&Tree.folder_node?/1)
      |> Map.new(fn node -> {node.folder.id, node.parent_folder_id} end)

    if Enum.all?(folder_ids, &acyclic?(&1, parents, MapSet.new())), do: :ok, else: {:error, :invalid_resource_parent}
  end

  defp acyclic?(nil, _parents, _seen), do: true

  defp acyclic?(folder_id, parents, seen) do
    if MapSet.member?(seen, folder_id) do
      false
    else
      acyclic?(Map.get(parents, folder_id), parents, MapSet.put(seen, folder_id))
    end
  end
end
