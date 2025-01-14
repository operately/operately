defmodule Operately.Operations.ResourceHubFolderCopying.Folders do
  alias Operately.ResourceHubs
  alias Operately.Operations.ResourceHubFolderCopying.Queries

  @doc """
  Recursively copies the given folder and all its child folders.

  Returns a list of all the child nodes (documents, files and links)
  present in any of the folders, which will be copied later in the
  same transaction.

  ## Parameters
    * folder - The source folder to copy
    * parent_folder_id - Optional ID of the new parent folder
  """
  def copy(folder, parent_folder_id \\ nil) do
    new_folder = copy_parent_folder(folder, parent_folder_id)
    children = fetch_and_categorize_children(folder.id)

    nested_children = Enum.map(children.folders, fn n -> copy(n.folder, new_folder.id) end)
    curr_children = Enum.map(children.others, fn n -> Map.put(n, :parent_folder_id, new_folder.id) end)

    List.flatten(nested_children ++ curr_children)
  end

  defp copy_parent_folder(folder, parent_folder_id) do
      node_attrs = prepare_node_attrs(folder.node, parent_folder_id)
      {:ok, new_node} = ResourceHubs.create_node(node_attrs)

      folder_attrs = prepare_folder_attrs(folder, new_node)
      {:ok, new_folder} = ResourceHubs.create_folder(folder_attrs)

      new_folder
  end

  defp prepare_node_attrs(node, parent_folder_id) do
    node
    |> Map.from_struct()
    |> then(fn attrs ->
      if parent_folder_id do
        Map.put(attrs, :parent_folder_id, parent_folder_id)
      else
        attrs
      end
    end)
  end

  defp prepare_folder_attrs(folder, new_node) do
    folder
    |> Map.from_struct()
    |> Map.put(:node_id, new_node.id)
  end

  defp fetch_and_categorize_children(folder_id) do
    folder_id
    |> Queries.query_folder_children()
    |> Enum.reduce(%{folders: [], others: []}, fn node, acc ->
      cond do
        node.folder -> Map.update!(acc, :folders, &([node | &1]))
        true -> Map.update!(acc, :others, &([node | &1]))
      end
    end)
  end
end
