defmodule Operately.Operations.ResourceHubFolderCopying.Nodes do
  alias Operately.Repo
  alias Operately.ResourceHubs.Node

  @doc """
  Creates a copy of each given node.

  The associated resource of the original node (document, link,
  or file) is not copied during this step. However, the resource
  is merged into the copied node so that it can be copied later
  within the same transaction.

  Returns a list of the newly copied nodes.
  """
  def copy(nodes, resource_hub) do
    nodes = generate_new_ids(nodes)

    data = prepare_node_data(nodes, resource_hub)

    count = length(data)
    {^count, new_nodes} = Repo.insert_all(Node, data, returning: true)

    merge_resources(new_nodes, nodes)
  end

  defp generate_new_ids(nodes) do
    Enum.map(nodes, &Map.put(&1, :new_id, Ecto.UUID.generate()))
  end

  defp prepare_node_data(nodes, resource_hub) do
    Enum.map(nodes, fn n ->
      now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

      %{
        id: n.new_id,
        resource_hub_id: resource_hub.id,
        parent_folder_id: n.parent_folder_id,
        name: n.name,
        type: n.type,
        inserted_at: now,
        updated_at: now,
      }
    end)
  end

  defp merge_resources(new_nodes, original_nodes) do
    Enum.map(new_nodes, fn new_node ->
      original_node = Enum.find(original_nodes, &(&1.new_id == new_node.id))

      Map.merge(new_node, %{
        folder: original_node.folder,
        document: original_node.document,
        link: original_node.link,
        file: original_node.file,
      })
    end)
  end
end
