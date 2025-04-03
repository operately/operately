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
    * parent_folder_id - ID of the new parent folder
  """
  def copy(folder, dest_resource_hub, attrs) do
    new_folder = copy_parent_folder(folder, dest_resource_hub, attrs)
    children = fetch_and_categorize_children(folder.id)

    nested_children = Enum.map(children.folders, fn n ->
      {:ok, {_folder, nodes}} = copy(n.folder, dest_resource_hub, %{parent_folder_id: new_folder.id})
      nodes
    end)
    curr_children = Enum.map(children.others, fn n -> Map.put(n, :parent_folder_id, new_folder.id) end)

    all_children = List.flatten(nested_children ++ curr_children)

    {:ok, {new_folder, all_children}}
  end

  defp copy_parent_folder(folder, resource_hub, attrs) do
      node_attrs = prepare_node_attrs(folder.node, resource_hub, attrs)
      {:ok, new_node} = ResourceHubs.create_node(node_attrs)

      folder_attrs = prepare_folder_attrs(folder, new_node)
      {:ok, new_folder} = ResourceHubs.create_folder(folder_attrs)

      new_folder
  end

  defp prepare_node_attrs(node, resource_hub, node_attrs) do
    node
    |> Map.from_struct()
    |> then(fn attrs ->
      Map.merge(attrs, %{
        resource_hub_id: resource_hub.id,
        parent_folder_id: node_attrs[:parent_folder_id],
        name: node_attrs[:name] || attrs.name,
      })
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
